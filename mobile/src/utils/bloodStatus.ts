import { BloodType, BloodStatus } from '../types';

// ── Blood status logic ────────────────────────────────────────────────────
export function getBloodStatus(units: number): BloodStatus {
  if (units === 0) return 'NOT_AVAILABLE';
  if (units <= 3) return 'LOW';
  return 'AVAILABLE';
}

export function getStatusColor(status: BloodStatus): string {
  switch (status) {
    case 'AVAILABLE':   return '#00C853';
    case 'LOW':         return '#FFD600';
    case 'NOT_AVAILABLE': return '#FF1744';
    default:            return '#9EA3B0';
  }
}

export function getStatusLabel(status: BloodStatus): string {
  switch (status) {
    case 'AVAILABLE':   return 'Available';
    case 'LOW':         return 'Low';
    case 'NOT_AVAILABLE': return 'Not Available';
    default:            return 'Unknown';
  }
}

export const BLOOD_TYPE_ORDER: BloodType[] = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
];
