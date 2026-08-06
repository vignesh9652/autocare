/** Shared domain types for the role-based dashboards (API-data driven). */

import type { VehicleType } from './common';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  registration: string;
  vehicleType: VehicleType;
  year: number;
  color: string;
  lastService?: string;
  nextServiceDue?: string;
  mileage: number;
  healthScore: number;
}

export interface Mechanic {
  id: number;
  name: string;
  experience: number;
  skills: string[];
  rating: number;
  reviewsCount: number;
  distance: number;
  available: boolean;
  jobsCompleted: number;
}

export interface Booking {
  id: string;
  vehicle: string;
  vehicleId: number;
  mechanic: string;
  service: string;
  date: string;
  time: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  location?: string;
  description?: string;
  emergency?: boolean;
}

export interface SparePart {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  rating: number;
  category: string;
  description?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  description: string;
  date: string;
  method: 'UPI' | 'Card' | 'Net Banking' | 'Cash';
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED' | 'FAILED';
}

export type NotificationType = 'booking' | 'payment' | 'message' | 'reminder' | 'system' | 'approval';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

export interface Review {
  id: number;
  mechanic: string;
  rating: number;
  comment: string;
  date: string;
  service?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicles: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  joined: string;
  totalSpent: number;
}

export interface AdminMechanic {
  id: number;
  name: string;
  experience: number;
  skills: string[];
  rating: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  jobs: number;
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

export interface AdminVehicle {
  id: number;
  owner: string;
  brand: string;
  model: string;
  registration: string;
  year: number;
  lastService?: string;
  status: 'ACTIVE' | 'SERVICING' | 'INACTIVE';
}

export interface AdminPart {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
  supplier: string;
  sales: number;
  status: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';
}

export interface AdminTransaction {
  id: string;
  customer: string;
  bookingId: string;
  date: string;
  method: string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED' | 'FAILED';
}

export interface AuditLog {
  id: number;
  action: string;
  actor: string;
  entity: string;
  detail: string;
  timestamp: string;
  category: 'AUTH' | 'BOOKING' | 'PAYMENT' | 'INVENTORY' | 'ADMIN';
}

export interface MessageThread {
  id: number;
  customer: string;
  vehicle: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export interface Recommendation {
  id: number;
  part: string;
  customer: string;
  vehicle: string;
  quantity: number;
  notes: string;
  status: 'SENT' | 'ACCEPTED' | 'DECLINED' | 'DRAFT';
  date: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  customer: string;
  vehicle: string;
  service: string;
  status: BookingStatus;
  amount: number;
}

export interface RepairStep {
  key: string;
  label: string;
  done: boolean;
  time?: string;
}
