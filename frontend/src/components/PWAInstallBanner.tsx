import { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // 1. Verificar si ya está en modo standalone (instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Ya está instalado, no hacemos nada
    }

    // 2. Verificar si el usuario ya lo descartó previamente
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed === 'true') {
      return;
    }

    // 3. Detectar la plataforma del dispositivo
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
      // Mostrar el banner de iOS tras un pequeño delay
      const timer = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(timer);
    } else {
      setPlatform(isAndroid ? 'android' : 'other');

      // Escuchar el evento antes de mostrar el prompt nativo en Android/Desktop Chrome
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install choice outcome: ${outcome}`);

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    // Guardamos la decisión para no molestar en sesiones futuras
    localStorage.setItem('pwa_install_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="pwa-install-banner glass-card">
      <div className="pwa-banner-content">
        <div className="pwa-icon-container">
          <img src="/assets/icon-192x192.png" alt="App Logo" className="pwa-logo-img" />
        </div>
        <div className="pwa-text-container">
          <h4 className="pwa-title">🏆 Prode Mundial 2026</h4>
          <p className="pwa-desc">
            {platform === 'ios' ? (
              <span>
                Para instalar en tu iPhone: presiona el botón <strong>Compartir</strong> (caja con flecha arriba) en Safari y elige <strong>"Agregar a pantalla de inicio"</strong>.
              </span>
            ) : (
              'Instala la app en tu pantalla de inicio para acceder al instante y recibir notificaciones de tus partidos.'
            )}
          </p>
        </div>
      </div>
      <div className="pwa-banner-actions">
        {platform !== 'ios' && (
          <button onClick={handleInstallClick} className="pwa-btn-install">
            Instalar App
          </button>
        )}
        <button onClick={handleDismiss} className="pwa-btn-close">
          {platform === 'ios' ? 'Entendido' : 'Ahora no'}
        </button>
      </div>
    </div>
  );
}
