import { useState } from 'react';
import { solicitarOTP, verificarOTP } from '../api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSolicitarOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await solicitarOTP(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar codigo');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await verificarOTP(email, codigo);
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
      window.location.href = res.usuario.rol === 'admin' ? '/admin' : '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Codigo invalido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>WC26 Predict</h1>
        <p className="subtitle">Ingresa para participar</p>

        {error && <div className="error-message">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSolicitarOTP}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar codigo'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerificarOTP}>
            <div className="form-group">
              <label htmlFor="codigo">Codigo de verificacion</label>
              <p className="hint">Ingresa el codigo enviado a {email}</p>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={() => { setStep('email'); setCodigo(''); setError(''); }}
            >
              Cambiar email
            </button>
          </form>
        )}

        <div className="otp-info">
          <small>En desarrollo: revisa la consola del backend para ver el codigo OTP</small>
        </div>
      </div>
    </div>
  );
}
