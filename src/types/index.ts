// CityCare Shared Types
// Add shared TypeScript interfaces and types here for team use

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'patient' | 'clinician' | 'admin';
  avatar?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies?: string[];
}

export interface Prescription {
  id: string;
  name: string;
  dosage: string;
  doctor: string;
  instructions: string;
  status: 'Active' | 'Completed' | 'Expired';
  date: string;
  patientId: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: string;
  date: string;
  doctor: string;
  diagnosis?: string;
  notes?: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  date: string;
  status: 'Normal' | 'Above normal' | 'Below normal' | 'Abnormal';
  value?: string;
  unit?: string;
  referenceRange?: string;
}

export interface BillingItem {
  id: string;
  patientId: string;
  description: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod?: string;
}

// Navigation types
export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}
