import * as inventoryService from '../services/inventoryService.js';
import {
  getAvailableBatchesForDisplay,
  getInventoryAggregated,
  getAddedTodayCount,
  getRemovedTodayCount,
  getAverageDailyUsage,
  getTopConsumed
} from '../repositories/inventoryRepository.js';

export const getSummary = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;

    // Individual bags for the table (with batch_code as Blood ID)
    const batches = await getAvailableBatchesForDisplay(hospitalId);

    // Aggregated per blood type for KPI summary cards
    const aggregated = await getInventoryAggregated(hospitalId);

    // Build a blood_type → total_units map from aggregation
    const bloodTypeMap = {};
    aggregated.forEach(row => {
      bloodTypeMap[row.blood_type] = (bloodTypeMap[row.blood_type] || 0) + Number(row.units_in_stock);
    });

    // Derive status per blood type
    function statusFor(units) {
      if (units === 0) return 'Critical';
      if (units <= 2)  return 'Low Stock';
      return 'Healthy';
    }

    // Map individual bags → inventory table rows
    const inventory = batches.map(b => {
      const units = bloodTypeMap[b.blood_type] || Number(b.total_units) || 0;
      return {
        batch_code:    b.batch_code || `BB-${new Date().getFullYear()}-000000`,
        blood_type:    b.blood_type,
        expiry_date:   b.expiry_date,
        units_in_stock: units,
        stock_status:  statusFor(units),
      };
    });

    // Summary card counts — based on unique blood types
    const uniqueTypes = Object.entries(bloodTypeMap).map(([type, units]) => ({
      type, units, status: statusFor(units)
    }));

    const totalUnits  = Object.values(bloodTypeMap).reduce((sum, u) => sum + u, 0);
    const lowStock    = uniqueTypes.filter(t => t.status === 'Low Stock').length;
    const critical    = uniqueTypes.filter(t => t.status === 'Critical').length;
    const healthy     = uniqueTypes.filter(t => t.status === 'Healthy').length;

    // Backward-compat fields for BloodBankDashboard
    const byBloodType  = uniqueTypes.map(t => ({ bloodType: t.type, units: t.units }));
    const addedToday   = await getAddedTodayCount(hospitalId);
    const removedToday = await getRemovedTodayCount(hospitalId);
    const averageDailyUsage = await getAverageDailyUsage(hospitalId);
    const topConsumed = await getTopConsumed(hospitalId);

    res.json({
      inventory,
      summary: { totalUnits, lowStock, critical, healthy },
      updatedAt: new Date().toISOString(),
      // dashboard compat
      byBloodType,
      totalUnits,
      addedToday,
      removedToday,
      averageDailyUsage,
      topConsumed,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addBlood = async (req, res) => {
  try {
    const result = await inventoryService.addBlood(req.user.hospitalId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeBlood = async (req, res) => {
  try {
    const result = await inventoryService.consumeBloodFIFO(req.user.hospitalId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
