import * as authService from '../services/authService.js';
import * as govRepo from '../repositories/governorateRepository.js';
import * as hospitalRepo from '../repositories/hospitalRepository.js';

export const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getGovernorates = async (req, res) => {
  try {
    const data = await govRepo.getAllGovernorates();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHospitals = async (req, res) => {
  const { governorateId } = req.query;
  try {
    const data = await hospitalRepo.getHospitalsByGovernorate(governorateId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
