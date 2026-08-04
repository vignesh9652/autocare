import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AppRoutes from '@/routes/AppRoutes';

/**
 * Application shell.
 *
 * BrowserRouter wraps everything (AuthProvider must be inside the Router so
 * components can use both useAuth() and useNavigate()/useLocation()).
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <AppRoutes />
          </main>
          <footer className="py-8 text-center text-sm text-slate-500">
            <div className="container-page">
              AutoCare Microservices Platform © {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
