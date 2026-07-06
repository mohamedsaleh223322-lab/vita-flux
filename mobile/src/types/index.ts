// ── Types for VitaFlux Mobile App ─────────────────────────────────────────

export interface User {
  id: string;           // UUID
  full_name: string;
  email: string | null;
  phone: string;
  role: string;
  governorate: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
  governorateId?: number;
}

export interface Governorate {
  id: number;           // integer PK
  name: string;
}

export interface Hospital {
  id: string;           // UUID
  name: string;
  governorate: string;
  address: string;
  phone: string;
  imageUrl: string | null;
  open24Hours: boolean;
  openingTime: string;
  closingTime: string;
  hasBloodBank: boolean;
  stockStatus: 'available' | 'unavailable';
  totalUnits: number;
  bloodTypesCount: number;
  // Legacy backward compat
  total_units: number;
  available_types: number;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BloodStatus = 'AVAILABLE' | 'LOW' | 'NOT_AVAILABLE';

export interface BloodInventoryItem {
  blood_type: BloodType;
  available_units: number;
}

export interface InventoryResponse {
  hospital_id: string;  // UUID
  inventory: BloodInventoryItem[];
  last_updated: string;
}

export interface FavoriteHospital extends Hospital {
  favorite_id: number;  // SERIAL PK from favorite_hospitals table
  favorited_at: string;
}

export interface AddFavoritePayload {
  hospitalId: string;   // UUID
}

export type MainTabsParamList = {
  Inventory: { hospitalId?: string; hospitalName?: string } | undefined;
  Hospital: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Tabs: {
    screen: 'Inventory' | 'Hospital' | 'Profile';
    params?: {
      hospitalId?: string;
      hospitalName?: string;
    };
  } | undefined; // Root for bottom tabs
  Governorate: undefined;
  Hospitals: { governorateId: number; governorateName: string };
  HospitalDetail: { hospitalId: string; hospitalName: string };   // UUID
  Inventory: { hospitalId: string; hospitalName: string };         // UUID
  Favorites: undefined;
  Profile: undefined;
  EditProfile: undefined;
};
