import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { AuthGuard } from './contexts/AuthGuard';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import RankingPage from './pages/RankingPage';

function Navbar() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {usuario ? (
          <>
            <Link to="/" className="nav-logo">
              <span className="material-symbols-outlined nav-icon" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
              PRODE BSC WC2026
            </Link>
            <div className="nav-links">
              <Link to="/ranking" className={isActive('/ranking')}>RANKING</Link>
              <Link to={usuario.rol === 'admin' ? '/admin' : '/dashboard'} className={isActive(usuario.rol === 'admin' ? '/admin' : '/dashboard')}>
                {usuario.rol === 'admin' ? 'ADMIN' : 'DASHBOARD'}
              </Link>
            </div>
            <button onClick={handleLogout} className="nav-btn" style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}>
              CERRAR SESION
            </button>
          </>
        ) : (
          <div style={{ marginLeft: 'auto' }}>
            <Link to="/login" className="nav-btn">LOGIN</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <AuthGuard requireAdmin>
                  <AdminPanel />
                </AuthGuard>
              }
            />
            <Route path="/" element={<RankingPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
