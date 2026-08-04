export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  vehicleType: string;
}

export interface Booking {
  id: number;
  vehicleId: number;
  serviceType: string;
  scheduledAt: string;
  status: string;
  address: string;
  mechanicName?: string;
}

export interface ServiceStatus {
  name: string;
  url: string;
  status: 'UP' | 'DOWN';
}
