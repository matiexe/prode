import { forwardRef } from 'react';
import UserAvatar from './UserAvatar';

interface ShareStatsProps {
  data: {
    top3: Array<{
      id: number;
      nombre: string;
      email: string;
      avatarSeed?: string;
      aciertos: number;
      certeros: number;
      parciales: number;
      total: number;
      puntos: number;
    }>;
    global: {
      certeros: number;
      parciales: number;
      total: number;
    };
  };
}

const ShareStatsImage = forwardRef<HTMLDivElement, ShareStatsProps>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: '1080px',
        height: '1920px',
        background: '#101415',
        backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(0, 228, 118, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(177, 198, 249, 0.15) 0%, transparent 50%)',
        color: '#e0e3e5',
        fontFamily: "'Lexend', sans-serif",
        padding: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorator */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'rgba(0, 228, 118, 0.05)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
      }}></div>

      <header style={{ textAlign: 'center', marginBottom: '40px', zIndex: 1 }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '16px', 
          background: 'rgba(29, 32, 34, 0.8)', 
          padding: '16px 32px', 
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontSize: '48px' }}>🏆</span>
          <h1 style={{ 
            fontFamily: "'Anybody', sans-serif", 
            fontSize: '48px', 
            fontWeight: 800, 
            margin: 0, 
            background: 'linear-gradient(135deg, #b1c6f9 0%, #00e476 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PRODE BSC 2026
          </h1>
        </div>
        <p style={{ fontSize: '32px', color: '#c5c6d0', marginTop: '32px', letterSpacing: '0.05em' }}>
          Resumen de la Jornada
        </p>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '64px', zIndex: 1 }}>
        {/* Top 3 Podium */}
        <div>
          <h2 style={{ 
            fontFamily: "'Anybody', sans-serif", 
            fontSize: '40px', 
            textAlign: 'center', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            marginBottom: '64px',
            color: '#b1c6f9'
          }}>
            Líderes Actuales
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '32px', height: '450px' }}>
            
            {/* Top 2 */}
            {data.top3[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
                <UserAvatar name={data.top3[1].avatarSeed || data.top3[1].nombre} size={140} />
                <div style={{
                  background: 'rgba(29, 32, 34, 0.9)',
                  borderTop: '6px solid #b1c6f9',
                  width: '100%',
                  padding: '32px 24px',
                  borderRadius: '24px 24px 0 0',
                  marginTop: '24px',
                  textAlign: 'center',
                  height: '280px'
                }}>
                  <div style={{ fontSize: '48px', fontWeight: 900, color: '#b1c6f9', fontFamily: "'Anybody', sans-serif", lineHeight: 1 }}>#2</div>
                  <h3 style={{ fontSize: '28px', margin: '16px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.top3[1].nombre}</h3>
                  <div style={{ fontSize: '40px', fontWeight: 800, color: '#00e476', fontFamily: "'Anybody', sans-serif" }}>{data.top3[1].puntos} PTS</div>
                </div>
              </div>
            )}

            {/* Top 1 */}
            {data.top3[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '320px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', fontSize: '64px', zIndex: 2 }}>👑</span>
                  <UserAvatar name={data.top3[0].avatarSeed || data.top3[0].nombre} size={180} />
                </div>
                <div style={{
                  background: 'linear-gradient(180deg, rgba(255,204,0,0.1) 0%, rgba(29, 32, 34, 0.9) 100%)',
                  borderTop: '8px solid #ffcc00',
                  width: '100%',
                  padding: '40px 24px',
                  borderRadius: '24px 24px 0 0',
                  marginTop: '24px',
                  textAlign: 'center',
                  height: '340px'
                }}>
                  <div style={{ fontSize: '56px', fontWeight: 900, color: '#ffcc00', fontFamily: "'Anybody', sans-serif", lineHeight: 1 }}>#1</div>
                  <h3 style={{ fontSize: '32px', margin: '20px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.top3[0].nombre}</h3>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: '#00e476', fontFamily: "'Anybody', sans-serif" }}>{data.top3[0].puntos} PTS</div>
                </div>
              </div>
            )}

            {/* Top 3 */}
            {data.top3[2] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
                <UserAvatar name={data.top3[2].avatarSeed || data.top3[2].nombre} size={120} />
                <div style={{
                  background: 'rgba(29, 32, 34, 0.9)',
                  borderTop: '6px solid #e0e3e5',
                  width: '100%',
                  padding: '24px',
                  borderRadius: '24px 24px 0 0',
                  marginTop: '24px',
                  textAlign: 'center',
                  height: '240px'
                }}>
                  <div style={{ fontSize: '40px', fontWeight: 900, color: '#e0e3e5', fontFamily: "'Anybody', sans-serif", lineHeight: 1 }}>#3</div>
                  <h3 style={{ fontSize: '24px', margin: '16px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.top3[2].nombre}</h3>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#00e476', fontFamily: "'Anybody', sans-serif" }}>{data.top3[2].puntos} PTS</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Stats */}
        <div style={{
          background: 'rgba(29, 32, 34, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '32px',
          padding: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '32px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <div style={{ fontSize: '56px', fontWeight: 900, fontFamily: "'Anybody', sans-serif", color: '#00e5ff' }}>{data.global.certeros}</div>
            <div style={{ fontSize: '24px', color: '#8e9099', textTransform: 'uppercase', fontWeight: 700, marginTop: '8px' }}>Aciertos Exactos</div>
          </div>
          <div>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📈</div>
            <div style={{ fontSize: '56px', fontWeight: 900, fontFamily: "'Anybody', sans-serif", color: '#00e476' }}>{data.global.parciales}</div>
            <div style={{ fontSize: '24px', color: '#8e9099', textTransform: 'uppercase', fontWeight: 700, marginTop: '8px' }}>Aciertos Parciales</div>
          </div>
          <div>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <div style={{ fontSize: '56px', fontWeight: 900, fontFamily: "'Anybody', sans-serif", color: '#b1c6f9' }}>{data.global.total}</div>
            <div style={{ fontSize: '24px', color: '#8e9099', textTransform: 'uppercase', fontWeight: 700, marginTop: '8px' }}>Partidos Jugados</div>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
        <p style={{ fontSize: '28px', color: '#c5c6d0', fontFamily: "'Anybody', sans-serif", fontWeight: 700 }}>
          prode2026.com
        </p>
      </footer>
    </div>
  );
});

ShareStatsImage.displayName = 'ShareStatsImage';

export default ShareStatsImage;
