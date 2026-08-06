import { Link } from 'react-router-dom';
import { Button } from '@/components';

export default function UnauthorizedPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="text-6xl" aria-hidden>🚫</span>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">Access denied</h1>
      <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
        Your account doesn&apos;t have permission to view this page. If you believe this is a
        mistake, contact an administrator.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="secondary">Back to Home</Button>
      </Link>
    </div>
  );
}
