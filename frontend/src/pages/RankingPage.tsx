import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerRanking } from '../api/pronosticos';
import { solicitarOTP, verificarOTP } from '../api/auth';
import { useAuth } from '../contexts/useAuth';
import type { RankingEntry } from '../types';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function RankingPage() {
  const { usuario } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await obtenerRanking();
        setRanking(data);
      } catch (err) {
        console.error('Error al obtener ranking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSolicitarOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await solicitarOTP(email);
      setStep('otp');
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Error al enviar codigo');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerificarOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await verificarOTP(email, codigo);
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
      window.location.href = res.usuario.rol === 'admin' ? '/admin' : '/dashboard';
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Codigo invalido');
    } finally {
      setLoginLoading(false);
    }
  };

  const top3 = ranking.filter((_, i) => i < 3);
  const rest = ranking.filter((_, i) => i >= 3);

  return (
    <div className="ranking-page">
      <div className="ranking-hero">
        <div className="hero-left">
          <div className="ranking-section">
            <div className="ranking-header">
              <h2>Ranking Global</h2>
              <div className="ranking-chips">
                <span className="ranking-chip">Temp. 1</span>
              </div>
            </div>

            {loading ? (
              <div className="loading">Cargando ranking...</div>
            ) : ranking.length === 0 ? (
              <div className="empty">Aun no hay puntajes registrados</div>
            ) : (
              <>
                <div className="top3-grid">
                  {top3.map((entry, i) => {
                    const isFirst = i === 0;
                    const orderClass = i === 0 ? 'top3-order-1' : i === 1 ? 'top3-order-2' : 'top3-order-3';
                    return (
                      <div key={entry.usuarioId} className={`top3-card ${isFirst ? 'is-first' : ''} ${orderClass}`}>
                        <div className="avatar-wrapper">
                          <div className={`top3-avatar-placeholder ${isFirst ? 'is-first' : ''}`}>
                            {getInitials(entry.nombre)}
                          </div>
                          {isFirst ? (
                            <div className="top3-badge">
                              <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                            </div>
                          ) : (
                            <div className="top3-badge">{i + 1}</div>
                          )}
                        </div>
                        <h3 className="top3-name">{entry.nombre}</h3>
                        <div className="top3-pts">{entry.puntos.toLocaleString()} PTS</div>
                      </div>
                    );
                  })}
                </div>

                {rest.length > 0 && (
                  <div className="ranking-table-container">
                    <table className="ranking-table">
                      <tbody>
                        {rest.map((entry) => (
                          <tr key={entry.usuarioId}>
                            <td className="ranking-pos">{String(entry.posicion).padStart(2, '0')}</td>
                            <td>
                              <div className="ranking-user">
                                <div className="ranking-user-avatar-placeholder">
                                  {getInitials(entry.nombre)}
                                </div>
                                <span className="ranking-user-name">{entry.nombre}</span>
                              </div>
                            </td>
                            <td>
                              <div className="ranking-aciertos">{entry.pronosticos} PRONOSTICOS</div>
                            </td>
                            <td className="ranking-pts">{entry.puntos.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="hero-right">
          {usuario ? (
            <Link to="/dashboard" style={{ display: 'block' }}>
              <img src="/fifa.jpg" alt="FIFA 2026" style={{ width: '100%', borderRadius: '16px', display: 'block' }} />
            </Link>
          ) : (
          <div className="login-card-inline">
            <div className="login-card-inner">
              <h2>Acceso al Sistema</h2>
              <p className="login-subtitle">Ingresa para gestionar tus pronosticos.</p>

              {loginError && <div className="error-message">{loginError}</div>}

              {step === 'email' ? (
                <form onSubmit={handleSolicitarOTP}>
                  <div className="form-group">
                    <label>Correo Electronico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@mundial.com"
                      required
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="login-submit-btn" disabled={loginLoading}>
                    {loginLoading ? 'Enviando...' : 'Enviar codigo'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerificarOTP}>
                  <div className="form-group">
                    <label>Codigo de verificacion</label>
                    <p className="hint">Ingresa el codigo enviado a {email}</p>
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="login-submit-btn" disabled={loginLoading}>
                    {loginLoading ? 'Verificando...' : 'Ingresar'}
                  </button>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => { setStep('email'); setCodigo(''); setLoginError(''); }}
                  >
                    Cambiar email
                  </button>
                </form>
              )}

              <div className="otp-hint">
                <small>En desarrollo: revisa la consola del backend para ver el codigo OTP</small>
              </div>

            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
