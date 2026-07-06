import dotenv from 'dotenv';
dotenv.config();

import { getHeatmapData, getDistributionData, getExpiryTimeline, getCurrentStock } from '../../src/services/analyticsService.js';

const hospitalId = '344cc3c6-56f6-4c90-a959-b9d7b0abfd61';
const fromDate = '2026-05-01';
const toDate = '2026-05-31';

(async () => {
    console.log('=== Calling Analytics Functions ===');

    console.log('--- Current Stock ---');
    const currentStock = await getCurrentStock(hospitalId);
    console.log('currentStock:', currentStock);

    console.log('--- Heatmap Data ---');
    const heatmapData = await getHeatmapData(hospitalId, fromDate, toDate);
    console.log('heatmapData:', heatmapData);

    console.log('--- Distribution Data ---');
    const distributionData = await getDistributionData(hospitalId, fromDate, toDate);
    console.log('distributionData:', distributionData);

    console.log('--- Expiry Timeline ---');
    const expiryTimeline = await getExpiryTimeline(hospitalId);
    console.log('expiryTimeline:', expiryTimeline);

    console.log('=== Done ===');
})();
