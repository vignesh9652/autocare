import { Link } from 'react-router-dom';
import { Button } from '@/components';

export default function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="text-6xl" aria-hidden>🧭</span>
      <h1 className="mt-4 text-3xl font-bold text-slate-100">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
