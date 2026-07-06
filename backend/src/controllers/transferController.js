import * as transferService from '../services/transferService.js';
import * as requestRepo from '../repositories/requestRepository.js';
import { query } from '../db/index.js';

export const listRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const offset = (page - 1) * limit;
    const result = await requestRepo.getRequests({
      hospitalId: req.user.hospitalId,
      filters,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createRequest = async (req, res) => {
  try {
    const request = await transferService.transferBlood(req.user.hospitalId, req.body);
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    let result;
    if (status === 'APPROVED') {
      result = await transferService.approveTransferRequest(req.user.hospitalId, id);
    } else if (status === 'REJECTED') {
      result = await transferService.rejectTransferRequest(req.user.hospitalId, id);
    } else if (status === 'COMPLETED') {
      result = await transferService.completeTransferRequest(req.user.hospitalId, id);
    } else {
      throw new Error('Invalid status update');
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFilters = async (req, res) => {
  try {
    const govPromise = query('SELECT id, name FROM governorates ORDER BY name ASC');
    const hospPromise = query('SELECT id, name, governorate FROM hospitals WHERE is_active = true ORDER BY name ASC');
    
    const [govResult, hospResult] = await Promise.all([govPromise, hospPromise]);

    const governorates = govResult.rows;
    const hospitals = hospResult.rows;
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const statuses = ['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'];
    const requestTypes = [
      { value: 'sent', label: 'Outgoing' },
      { value: 'received', label: 'Incoming' }
    ];

    res.json({
      governorates,
      hospitals,
      bloodTypes,
      statuses,
      requestTypes
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

