import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRedirect from './RoleRedirect';
import PublicLayout from './PublicLayout';
import { ADMIN_NAV, CUSTOMER_NAV, MECHANIC_NAV } from '@/components/dashboard/dashboardNav';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HomePage from '@/pages/HomePage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import RegisterMechanicPage from '@/pages/auth/RegisterMechanicPage';

// Legacy (API-connected) feature pages
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

// Customer dashboard
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import MyVehicles from '@/pages/customer/MyVehicles';
import BookService from '@/pages/customer/BookService';
import MyBookings from '@/pages/customer/MyBookings';
import BookingHistory from '@/pages/customer/BookingHistory';
import SparePartsMarketplace from '@/pages/customer/SparePartsMarketplace';
import MarketPartDetail from '@/pages/customer/PartDetail';
import InstallationGuide from '@/pages/customer/InstallationGuide';
import BookMechanic from '@/pages/customer/BookMechanic';
import MarketCheckout from '@/pages/customer/Checkout';
import MyOrders from '@/pages/customer/MyOrders';
import OrderDetail from '@/pages/customer/OrderDetail';
import CustomerPayments from '@/pages/customer/CustomerPayments';
import CustomerReviews from '@/pages/customer/CustomerReviews';
import CustomerProfile from '@/pages/customer/CustomerProfile';
import CustomerSettings from '@/pages/customer/CustomerSettings';

// Mechanic dashboard
import MechanicDashboard from '@/pages/mechanic/MechanicDashboard';
import AssignedJobs from '@/pages/mechanic/AssignedJobs';
import ActiveRepairs from '@/pages/mechanic/ActiveRepairs';
import CompletedJobs from '@/pages/mechanic/CompletedJobs';
import PartRecommendations from '@/pages/mechanic/PartRecommendations';
import InstallationJobs from '@/pages/mechanic/InstallationJobs';
import CustomerMessages from '@/pages/mechanic/CustomerMessages';
import Availability from '@/pages/mechanic/Availability';
import Earnings from '@/pages/mechanic/Earnings';
import Performance from '@/pages/mechanic/Performance';
import MechanicProfile from '@/pages/mechanic/MechanicProfile';

// Admin dashboard
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import AdminMechanics from '@/pages/admin/AdminMechanics';
import AdminVehicles from '@/pages/admin/AdminVehicles';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminParts from '@/pages/admin/AdminParts';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminReports from '@/pages/admin/AdminReports';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import SystemSettings from '@/pages/admin/SystemSettings';
import AuditLogs from '@/pages/admin/AuditLogs';
import AdminProfile from '@/pages/admin/AdminProfile';

// Shared
import NotificationsPage from '@/pages/shared/NotificationsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public / legacy layout (top navbar) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/mechanic" element={<RegisterMechanicPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/vehicles" element={<ProtectedRoute><VehicleList /></ProtectedRoute>} />
        <Route path="/vehicles/new" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
        <Route path="/vehicles/:id/edit" element={<ProtectedRoute><VehicleForm /></ProtectedRoute>} />
        <Route path="/mechanics" element={<ProtectedRoute><MechanicList /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><BookingList /></ProtectedRoute>} />
        <Route path="/bookings/new" element={<ProtectedRoute><NewBooking /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
        <Route path="/spare-parts" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
        <Route path="/spare-parts/:id" element={<ProtectedRoute><PartDetail /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
        <Route path="/payments/:bookingId/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
      </Route>

      {/* Customer dashboard */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute requiredRole="CUSTOMER">
            <DashboardLayout nav={CUSTOMER_NAV} base="/customer" />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="vehicles" element={<MyVehicles />} />
        <Route path="book-service" element={<BookService />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="history" element={<BookingHistory />} />
        <Route path="parts" element={<SparePartsMarketplace />} />
        <Route path="parts/:id" element={<MarketPartDetail />} />
        <Route path="parts/:id/install-guide" element={<InstallationGuide />} />
        <Route path="parts/:id/book-mechanic" element={<BookMechanic />} />
        <Route path="checkout" element={<MarketCheckout />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="payments" element={<CustomerPayments />} />
        <Route path="reviews" element={<CustomerReviews />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="settings" element={<CustomerSettings />} />
      </Route>

      {/* Mechanic dashboard */}
      <Route
        path="/mechanic"
        element={
          <ProtectedRoute requiredRole="MECHANIC">
            <DashboardLayout nav={MECHANIC_NAV} base="/mechanic" />
          </ProtectedRoute>
        }
      >
        <Route index element={<MechanicDashboard />} />
        <Route path="jobs" element={<AssignedJobs />} />
        <Route path="repairs" element={<ActiveRepairs />} />
        <Route path="completed" element={<CompletedJobs />} />
        <Route path="recommendations" element={<PartRecommendations />} />
        <Route path="installation-jobs" element={<InstallationJobs />} />
        <Route path="messages" element={<CustomerMessages />} />
        <Route path="availability" element={<Availability />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="performance" element={<Performance />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<MechanicProfile />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <DashboardLayout nav={ADMIN_NAV} base="/admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="mechanics" element={<AdminMechanics />} />
        <Route path="vehicles" element={<AdminVehicles />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="parts" element={<AdminParts />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Role-based post-login landing */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
