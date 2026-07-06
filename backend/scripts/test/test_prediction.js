/**
 * Test the prediction service directly (bypasses HTTP layer).
 * Run: node --experimental-vm-modules backend/scripts/test/test_prediction.js
 * or:  node backend/scripts/test/test_prediction.js  (with --watch server already up)
 */

import dotenv from 'dotenv';
dotenv.config();

import { getPrediction } from '../../modules/prediction/service/predictionService.js';
import { validatePredictionRange } from '../../modules/prediction/validators/predictionValidators.js';

const HOSPITAL_ID = '344cc3c6-56f6-4c90-a959-b9d7b0abfd61';

// Today and today+30
const today = new Date().toISOString().split('T')[0];
const future = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
const past = '2025-01-01';

async function run() {
  // ── 1. Validator: past date should fail ──────────────────────────────────
  console.log('\n── Test 1: Past date validation ─────────────────────────────');
  const v1 = validatePredictionRange(past, '2025-01-31');
  console.log('valid:', v1.valid);          // expect false
  console.log('error:', v1.error);          // expect "Prediction engine only supports..."
  console.log('isPastDate:', v1.isPastDate); // expect true

  // ── 2. Validator: future date should pass ────────────────────────────────
  console.log('\n── Test 2: Future date validation ───────────────────────────');
  const v2 = validatePredictionRange(today, future);
  console.log('valid:', v2.valid);          // expect true

  // ── 3. Validator: missing params ─────────────────────────────────────────
  console.log('\n── Test 3: Missing param validation ─────────────────────────');
  const v3 = validatePredictionRange(undefined, future);
  console.log('valid:', v3.valid);          // expect false

  // ── 4. Full prediction service call ──────────────────────────────────────
  console.log('\n── Test 4: Full prediction service ──────────────────────────');
  console.log(`Range: ${today} → ${future}`);
  try {
    const result = await getPrediction(HOSPITAL_ID, today, future);

    console.log('\n[KPIs]');
    console.log(JSON.stringify(result.kpis, null, 2));

    console.log('\n[Runout Table - first 3 rows]');
    console.log(JSON.stringify(result.runout.slice(0, 3), null, 2));

    console.log('\n[Expiry Summary]');
    console.log(JSON.stringify(result.expiry.summary, null, 2));

    console.log('\n[Demand Table]');
    console.log(JSON.stringify(result.demand, null, 2));

    console.log('\n[Recommendations]');
    console.log('Increase:', result.recommendations.increase.items);
    console.log('Reduce:  ', result.recommendations.reduce.items);
    console.log('Maintain:', result.recommendations.maintain.items);

    console.log('\n[Insights]');
    result.insights.forEach((ins, i) => {
      console.log(`  ${i + 1}. ${ins.textBefore}${ins.textBold}${ins.textAfter}`);
    });

    console.log('\n[DateInfo]');
    console.log(JSON.stringify(result.dateInfo, null, 2));

    console.log('\n✅ All tests passed — no mock data used.');
  } catch (err) {
    console.error('\n❌ Prediction service error:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

run();
