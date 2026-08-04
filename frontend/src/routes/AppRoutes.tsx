import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VehicleList from '@/pages/vehicles/VehicleList';
import VehicleForm from '@/pages/vehicles/VehicleForm';
import MechanicList from '@/pages/mechanics/MechanicList';
import BookingList from '@/pages/bookings/BookingList';
import NewBooking from '@/pages/bookings/NewBooking';
import BookingDetail from '@/pages/bookings/BookingDetail';
import Catalog from '@/pages/spareparts/Catalog';
import PartDetail from '@/pages/spareparts/PartDetail';
import PaymentHistory from '@/pages/payments/PaymentHistory';
import Checkout from '@/pages/payments/Checkout';
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

      {/* Vehicles */}
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <VehicleList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/new"
        element={
          <ProtectedRoute>
            <VehicleForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:id/edit"
        element={
          <ProtectedRoute>
            <VehicleForm />
          </ProtectedRoute>
        }
      />

      {/* Mechanics (browse only) */}
      <Route
        path="/mechanics"
        element={
          <ProtectedRoute>
            <MechanicList />
          </ProtectedRoute>
        }
      />

      {/* Bookings */}
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/new"
        element={
          <ProtectedRoute>
            <NewBooking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <BookingDetail />
          </ProtectedRoute>
        }
      />

      {/* Spare parts */}
      <Route
        path="/spare-parts"
        element={
          <ProtectedRoute>
            <Catalog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spare-parts/:id"
        element={
          <ProtectedRoute>
            <PartDetail />
          </ProtectedRoute>
        }
      />

      {/* Payments */}
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments/:bookingId/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />

      {/* Reviews */}
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
