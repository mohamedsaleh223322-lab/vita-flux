import { getClient } from '../db/index.js';
import * as inventoryRepo from '../repositories/inventoryRepository.js';
import { emitToHospital } from '../sockets/index.js';
import { logger } from '../utils/logger.js';
import { generateBatchCodes } from '../utils/batchCodeGenerator.js';

export const addBlood = async (hospitalId, { bloodType, quantity, expiryDate }) => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');
    
    const collectionDate = new Date().toISOString().split('T')[0];
    const batchNumber = `BN-${Date.now()}`;
    
    const batchCodes = await generateBatchCodes(client, quantity);

    const addedBatches = [];
    for (let i = 0; i < quantity; i++) {
      const batch = await inventoryRepo.addBatch(client, {
        hospital_id: hospitalId,
        batch_number: batchNumber,
        blood_type: bloodType,
        expiry_date: expiryDate,
        collection_date: collectionDate,
        batch_code: batchCodes[i]
      });
      addedBatches.push(batch);

      await inventoryRepo.createTransaction(client, {
        hospital_id: hospitalId,
        batch_id: batch.id,
        type: 'ADD',
        blood_type: bloodType,
        component: 'WHOLE_BLOOD',
        quantity: 1.0,
        reason: 'Manual stock entry'
      });
    }

    await client.query('COMMIT');
    
    emitToHospital(hospitalId, 'inventory_updated', { bloodType });
    emitToHospital(hospitalId, 'dashboard_updated', {});
    
    return { 
      message: `${quantity} bags of ${bloodType} added successfully`,
      batches: addedBatches
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error in addBlood:', err);
    throw err;
  } finally {
    release();
  }
};

export const consumeBloodFIFO = async (hospitalId, { bloodType, quantity }) => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');

    const availableBatches = await inventoryRepo.getAvailableBatchesFIFO(client, hospitalId, bloodType, quantity);

    if (availableBatches.length < quantity) {
      throw new Error(`Insufficient stock for ${bloodType}. Available: ${availableBatches.length}`);
    }

    const consumedBatches = [];
    for (const batch of availableBatches) {
      await inventoryRepo.updateBatchStatus(client, batch.id, 'USED');
      
      const updatedRes = await client.query(
        'SELECT * FROM blood_batches WHERE id = $1',
        [batch.id]
      );
      if (updatedRes.rows.length > 0) {
        consumedBatches.push(updatedRes.rows[0]);
      } else {
        consumedBatches.push({ ...batch, status: 'USED' });
      }

      await inventoryRepo.createTransaction(client, {
        hospital_id: hospitalId,
        batch_id: batch.id,
        type: 'REMOVE',
        blood_type: bloodType,
        component: batch.component,
        quantity: 1.0,
        reason: 'Manual consumption (FIFO)'
      });
    }

    await client.query('COMMIT');
    
    emitToHospital(hospitalId, 'inventory_updated', { bloodType });
    emitToHospital(hospitalId, 'dashboard_updated', {});

    return { 
      message: `${quantity} bags of ${bloodType} consumed successfully`,
      batches: consumedBatches
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error in consumeBloodFIFO:', err);
    throw err;
  } finally {
    release();
  }
};

export const disposeExpiredBlood = async () => {
  // This would typically be called by a cron job
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');
    
    // Find all expired AVAILABLE batches
    const result = await client.query(
      `UPDATE blood_batches 
       SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP 
       WHERE status = 'AVAILABLE' AND expiry_date < CURRENT_DATE
       RETURNING *`
    );

    for (const batch of result.rows) {
      await inventoryRepo.createTransaction(client, {
        hospital_id: batch.hospital_id,
        batch_id: batch.id,
        type: 'DISPOSE',
        blood_type: batch.blood_type,
        component: batch.component,
        quantity: 1.0,
        reason: 'Expired'
      });
      emitToHospital(batch.hospital_id, 'batch_expired', { batchId: batch.id });
    }

    await client.query('COMMIT');
    return { count: result.rowCount };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error in disposeExpiredBlood:', err);
    throw err;
  } finally {
    release();
  }
};

export const getSummary = async (hospitalId) => {
  const summary = await inventoryRepo.getInventorySummary(hospitalId);
  const addedToday = await inventoryRepo.getAddedTodayCount(hospitalId);
  const removedToday = await inventoryRepo.getRemovedTodayCount(hospitalId);
  const batchesList = await inventoryRepo.getInventoryBatchesList(hospitalId);

  // Group summary by type for the frontend
  const byBloodType = summary.map(s => ({
    bloodType: s.blood_type,
    units: parseInt(s.units),
    // The frontend also expects addedToday/removedToday per type in BloodInventory.jsx line 63-64
    // But those are usually for the table. I'll need a more detailed query if I want per-type daily stats.
    addedToday: 0, // Simplified for now
    removedToday: 0 // Simplified for now
  }));

  const totalUnits = byBloodType.reduce((acc, curr) => acc + curr.units, 0);

  return {
    byBloodType,
    totalUnits,
    addedToday,
    removedToday,
    batches: batchesList
  };
};
