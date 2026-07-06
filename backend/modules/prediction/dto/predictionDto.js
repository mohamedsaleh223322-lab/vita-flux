/**
 * prediction/dto/predictionDto.js
 *
 * Shape definitions (JSDoc) for the prediction response payload.
 * Nothing is imported here — this is documentation only.
 *
 * @typedef {Object} RunoutRow
 * @property {string} bloodGroup
 * @property {number} currentStock
 * @property {number} avgDailyUsage
 * @property {string} daysLeft        human-readable e.g. "6 days" | ">30 days"
 * @property {'Critical'|'High Risk'|'Moderate'|'Safe'} riskLevel
 *
 * @typedef {Object} ExpiryItem
 * @property {string} bloodGroup
 * @property {number} bags
 * @property {string} earliestExpiry  formatted date string
 *
 * @typedef {Object} DemandRow
 * @property {string} bloodGroup
 * @property {number} units
 * @property {string} fill            hex colour
 *
 * @typedef {Object} RecommendationGroup
 * @property {string}   subtitle
 * @property {string[]} items         blood group names
 * @property {string}   footer
 *
 * @typedef {Object} InsightRow
 * @property {'trend'|'clock'|'drop'|'truck'} icon
 * @property {string} textBefore
 * @property {string} textBold
 * @property {string} textAfter
 *
 * @typedef {Object} PredictionResponse
 * @property {{ willRunOut: number, mayExpire: number, totalDemand: number,
 *              healthScore: number, healthLabel: string,
 *              aiConfidence: number, aiLabel: string }} kpis
 * @property {RunoutRow[]} runout
 * @property {{ summary: { count: number }, items: ExpiryItem[] }} expiry
 * @property {DemandRow[]} demand
 * @property {{ increase: RecommendationGroup, reduce: RecommendationGroup,
 *              maintain: RecommendationGroup }} recommendations
 * @property {InsightRow[]} insights
 * @property {{ historicalFrom: string, historicalTo: string,
 *              futureEnd: string, daysInPeriod: number,
 *              isHistorical: false }} dateInfo
 */
