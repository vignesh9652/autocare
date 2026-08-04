import { Link, useNavigate } from 'react-router-dom';
import { getToken, clearToken } from '../api/client';

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(getToken());

  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="brand">
          🚗 Auto<span>Care</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="link">Home</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="link">Dashboard</Link>
              <button className="btn ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="link">Login</Link>
              <Link to="/register" className="btn">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
