import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';

/** Layout for public / non-dashboard pages (home, auth, legacy feature pages). */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-8 text-center text-sm text-slate-500 dark:text-slate-500">
        <div className="container-page">AutoCare Microservices Platform © {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
