import { getClient } from '../db/index.js';
import * as requestRepo from '../repositories/requestRepository.js';
import * as inventoryRepo from '../repositories/inventoryRepository.js';
import { emitToHospital } from '../sockets/index.js';
import { logger } from '../utils/logger.js';
import { generateBatchCodes } from '../utils/batchCodeGenerator.js';

export const transferBlood = async (hospitalId, { providerHospitalId, bloodType, quantity, priority, reason, expiryDate }) => {
  if (hospitalId === providerHospitalId) {
    throw new Error('Hospital cannot request from itself');
  }
  
  const request = await requestRepo.createRequest(null, {
    requester_hospital_id: hospitalId,
    provider_hospital_id: providerHospitalId,
    blood_type: bloodType,
    quantity,
    priority,
    reason,
    expiry_date: expiryDate
  });

  emitToHospital(providerHospitalId, 'request_created', request);
  return request;
};

export const approveTransferRequest = async (providerHospitalId, requestId) => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');

    const request = await requestRepo.getRequestById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.provider_hospital_id !== providerHospitalId) throw new Error('Unauthorized');
    if (request.status !== 'PENDING') throw new Error('Request is not in PENDING status');

    // 1. Check sender stock
    const availableBatches = await inventoryRepo.getAvailableBatchesFIFO(client, providerHospitalId, request.blood_type, request.quantity);
    if (availableBatches.length < request.quantity) {
      throw new Error(`Insufficient stock for ${request.blood_type}. Available: ${availableBatches.length}`);
    }

    // 2. Consume sender FIFO
    for (const batch of availableBatches) {
      await inventoryRepo.updateBatchStatus(client, batch.id, 'IN_TRANSFER');
      await inventoryRepo.createTransaction(client, {
        hospital_id: providerHospitalId,
        batch_id: batch.id,
        type: 'TRANSFER_OUT',
        blood_type: request.blood_type,
        component: batch.component,
        quantity: 1.0,
        reason: `Transfer to hospital ${request.requester_hospital_id}`
      });
    }

    // Link batches to request
    await requestRepo.linkBatchesToRequest(client, requestId, availableBatches.map(b => b.id));

    // 3. Update status to IN_TRANSIT
    const updatedRequest = await requestRepo.updateRequestStatus(client, requestId, 'IN_TRANSIT');

    await client.query('COMMIT');
    
    emitToHospital(request.requester_hospital_id, 'request_approved', updatedRequest);
    emitToHospital(providerHospitalId, 'request_updated', updatedRequest);
    
    return updatedRequest;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error in approveTransferRequest:', err);
    throw err;
  } finally {
    release();
  }
};

export const completeTransferRequest = async (requesterHospitalId, requestId) => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');

    const request = await requestRepo.getRequestById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.requester_hospital_id !== requesterHospitalId) throw new Error('Unauthorized');
    if (request.status !== 'IN_TRANSIT') throw new Error('Request is not IN_TRANSIT');

    const batches = await requestRepo.getBatchesByRequest(requestId);
    
    const batchCodes = await generateBatchCodes(client, batches.length);

    // 4. Create new AVAILABLE batches for receiver
    for (let i = 0; i < batches.length; i++) {
      const originalBatch = batches[i];
      const newBatch = await inventoryRepo.addBatch(client, {
        hospital_id: requesterHospitalId,
        batch_number: originalBatch.batch_number,
        blood_type: originalBatch.blood_type,
        expiry_date: originalBatch.expiry_date,
        collection_date: originalBatch.collection_date,
        batch_code: batchCodes[i]
      });

      await inventoryRepo.createTransaction(client, {
        hospital_id: requesterHospitalId,
        batch_id: newBatch.id,
        type: 'TRANSFER_IN',
        blood_type: newBatch.blood_type,
        component: newBatch.component,
        quantity: 1.0,
        reason: `Transfer from hospital ${request.provider_hospital_id}`
      });
      
      // Mark original batch as USED (or COMPLETED_TRANSFER)
      await inventoryRepo.updateBatchStatus(client, originalBatch.id, 'USED');
    }

    const updatedRequest = await requestRepo.updateRequestStatus(client, requestId, 'COMPLETED');

    await client.query('COMMIT');
    
    emitToHospital(request.requester_hospital_id, 'inventory_updated', { bloodType: request.blood_type });
    emitToHospital(request.provider_hospital_id, 'inventory_updated', { bloodType: request.blood_type });
    emitToHospital(request.provider_hospital_id, 'request_updated', updatedRequest);

    return updatedRequest;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error in completeTransferRequest:', err);
    throw err;
  } finally {
    release();
  }
};

export const rejectTransferRequest = async (providerHospitalId, requestId) => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');
    const request = await requestRepo.getRequestById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.provider_hospital_id !== providerHospitalId) throw new Error('Unauthorized');
    if (request.status !== 'PENDING') throw new Error('Request is not in PENDING status');

    const updatedRequest = await requestRepo.updateRequestStatus(client, requestId, 'REJECTED');
    await client.query('COMMIT');

    emitToHospital(updatedRequest.requester_hospital_id, 'request_rejected', updatedRequest);
    emitToHospital(providerHospitalId, 'request_updated', updatedRequest);
    return updatedRequest;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error in rejectTransferRequest:', err);
    throw err;
  } finally {
    release();
  }
};
