import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VehiclesPage from '@/pages/vehicles/VehiclesPage';
import MechanicsPage from '@/pages/mechanics/MechanicsPage';
import BookingsPage from '@/pages/bookings/BookingsPage';
import SparePartsPage from '@/pages/spareparts/SparePartsPage';
import PaymentsPage from '@/pages/payments/PaymentsPage';
import ReviewsPage from '@/pages/reviews/ReviewsPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated — /dashboard is the post-login landing page (currently routes to /vehicles). */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Navigate to="/vehicles" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <VehiclesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mechanics"
        element={
          <ProtectedRoute>
            <MechanicsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spare-parts"
        element={
          <ProtectedRoute>
            <SparePartsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <ReviewsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
