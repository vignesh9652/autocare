import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { MarketplaceProvider } from '@/context/MarketplaceStore';
import AppRoutes from '@/routes/AppRoutes';

/**
 * Application shell.
 *
 * BrowserRouter wraps everything (AuthProvider must be inside the Router so
 * components can use both useAuth() and useNavigate()/useLocation()).
 * ThemeProvider toggles the `dark` class on <html>; ToastProvider renders
 * the global notification stack; MarketplaceProvider shares the spare-part
 * cart and orders across the customer dashboard.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <MarketplaceProvider>
              <AppRoutes />
            </MarketplaceProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
