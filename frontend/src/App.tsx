import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { LandingScreen } from '@/features/landing/LandingScreen';
import { MechanicsScreen } from '@/features/catalog/MechanicsScreen';
import { PartsCatalogScreen } from '@/features/catalog/PartsCatalogScreen';
import { PartDetailScreen } from '@/features/catalog/PartDetailScreen';
import { CartScreen } from '@/features/catalog/CartScreen';
import { CheckoutScreen } from '@/features/catalog/CheckoutScreen';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { RegisterScreen } from '@/features/auth/RegisterScreen';
import { RegisterMechanicScreen } from '@/features/auth/RegisterMechanicScreen';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen';

// Customer
import { CustomerOverview } from '@/features/customer/CustomerOverview';
import { MyVehicles } from '@/features/customer/MyVehicles';
import { BookServiceScreen } from '@/features/booking/BookServiceScreen';
import { MyBookings } from '@/features/customer/MyBookings';
import { MyPayments } from '@/features/customer/MyPayments';
import { PaymentScreen } from '@/features/customer/PaymentScreen';
import { MyReviews } from '@/features/customer/MyReviews';
import { MarketplaceScreen } from '@/features/catalog/MarketplaceScreen';

// Mechanic
import { MechanicOverview } from '@/features/mechanic/MechanicOverview';
import { AssignedJobs } from '@/features/mechanic/AssignedJobs';
import { Availability } from '@/features/mechanic/Availability';
import { Recommendations } from '@/features/mechanic/Recommendations';
import { MechanicProfile } from '@/features/mechanic/MechanicProfile';

// Admin
import { AdminOverview } from '@/features/admin/AdminOverview';
import { AdminBookings } from '@/features/admin/AdminBookings';
import { AdminMechanics } from '@/features/admin/AdminMechanics';
import { AdminCustomers } from '@/features/admin/AdminCustomers';
import { AdminPayments } from '@/features/admin/AdminPayments';
import { AdminApprovals } from '@/features/admin/AdminApprovals';
import { AdminServices } from '@/features/admin/AdminServices';

export default function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/mechanics" element={<MechanicsScreen />} />
        <Route path="/parts" element={<PartsCatalogScreen />} />
        <Route path="/parts/:id" element={<PartDetailScreen />} />
        <Route path="/cart" element={<CartScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/register/mechanic" element={<RegisterMechanicScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="*" element={<LandingScreen />} />
      </Route>

      {/* ── Authenticated (all roles) ──────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/checkout" element={<CheckoutScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
      </Route>

      {/* ── Customer dashboard ─────────────────────────── */}
      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<CustomerOverview />} />
          <Route path="vehicles" element={<MyVehicles />} />
          <Route path="book-service" element={<BookServiceScreen />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="payments" element={<MyPayments />} />
          <Route path="pay/:bookingId" element={<PaymentScreen />} />
          <Route path="reviews" element={<MyReviews />} />
          <Route path="marketplace" element={<MarketplaceScreen />} />
        </Route>
      </Route>

      {/* ── Mechanic dashboard ─────────────────────────── */}
      <Route element={<ProtectedRoute roles={['MECHANIC']} />}>
        <Route path="/mechanic" element={<DashboardLayout />}>
          <Route index element={<MechanicOverview />} />
          <Route path="jobs" element={<AssignedJobs />} />
          <Route path="availability" element={<Availability />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="profile" element={<MechanicProfile />} />
        </Route>
      </Route>

      {/* ── Admin dashboard ────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="mechanics" element={<AdminMechanics />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="approvals" element={<AdminApprovals />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
