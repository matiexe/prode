import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { AuthGuard } from './contexts/AuthGuard';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import RankingPage from './pages/RankingPage';

function Navbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { usuario } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {usuario ? (
          <>
            <button className="mobile-menu-btn" onClick={onOpenMenu}>
              <span className="material-symbols-outlined">menu</span>
              MENÚ
            </button>
            <Link to="/" className="nav-logo">
              <span className="material-symbols-outlined nav-icon" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
              PRODE BSC WC2026
            </Link>
            <div className="nav-links">
              <Link to="/ranking" className={isActive('/ranking')}>RANKING</Link>
              <Link to="/dashboard" className={isActive('/dashboard')}>DASHBOARD</Link>
              {usuario.rol === 'admin' && (
                <Link to="/admin" className={isActive('/admin')}>ADMIN</Link>
              )}
            </div>
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

function GlobalSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  if (!usuario) return null;

  const handleLogout = () => {
    logout();
    onClose();
    window.location.href = '/';
  };

  return (
    <>
      {open && <div className="global-sidebar-overlay" onClick={onClose} />}
      <aside className={`global-sidebar ${open ? 'open' : ''}`}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div className="nav-logo" style={{ fontSize: '1.2rem' }}>
            <span className="material-symbols-outlined nav-icon" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
            PRODE 2026
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.5rem' }}>Hola, {usuario.nombre}</p>
        </div>
        
        <nav style={{ flex: 1 }}>
          <Link to="/ranking" className={`sidebar-link ${isActive('/ranking')}`} onClick={onClose}>
            <span className="material-symbols-outlined">leaderboard</span>
            Ranking
          </Link>
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`} onClick={onClose}>
            <span className="material-symbols-outlined">dashboard</span>
            Mi Prode
          </Link>
          {usuario.rol === 'admin' && (
            <Link to="/admin" className={`sidebar-link ${isActive('/admin')}`} onClick={onClose}>
              <span className="material-symbols-outlined">admin_panel_settings</span>
              Administración
            </Link>
          )}
        </nav>

        <div style={{ padding: '2rem 1rem' }}>
          <button 
            onClick={handleLogout} 
            className="admin-btn danger" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAdminPath = location.pathname === '/admin';

  return (
    <>
      {!isAdminPath && <Navbar onOpenMenu={() => setMenuOpen(true)} />}
      {!isAdminPath && <GlobalSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />}
      <main className={isAdminPath ? "admin-wrapper" : "main-content"}>
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
          <Route path="*" element={<RankingPage />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}


