import { forwardRef } from 'react';
import UserAvatar from './UserAvatar';

interface ShareStatsProps {
  contexto: string;
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

const ShareStatsImage = forwardRef<HTMLDivElement, ShareStatsProps>(({ contexto, data }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: '1080px',
        height: '1920px',
        background: '#0d1112', // Slightly darker background for better contrast
        backgroundImage: 'radial-gradient(circle at top left, rgba(0, 229, 255, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(0, 228, 118, 0.1), transparent 40%)',
        color: '#e0e3e5',
        fontFamily: "'Lexend', sans-serif",
        padding: '60px 40px',
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
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(0, 228, 118, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}></div>

      {/* Header */}
      <header style={{ textAlign: 'center', marginTop: '20px', zIndex: 1 }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '16px', 
          background: 'rgba(255, 255, 255, 0.03)', 
          padding: '16px 40px', 
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <span style={{ fontSize: '40px' }}>🏆</span>
          <h1 style={{ 
            fontFamily: "'Anybody', sans-serif", 
            fontSize: '40px', 
            fontWeight: 900, 
            margin: 0, 
            color: '#00e5ff', // Solid color for html2canvas compatibility
            letterSpacing: '0.05em'
          }}>
            PRODE BSC 2026
          </h1>
        </div>
        <p style={{ 
          fontSize: '36px', 
          color: '#ffffff', 
          marginTop: '40px', 
          fontWeight: 700,
          fontFamily: "'Anybody', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          {contexto}
        </p>
      </header>

      {/* Main Content - Podium */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1, padding: '0 20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '24px', height: '600px', marginBottom: '80px' }}>
          
          {/* Posicion 2 */}
          {data.top3[1] && (
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px',
              background: 'rgba(255,255,255,0.03)',
              borderTop: '6px solid #b1c6f9',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '32px',
              padding: '40px 20px 30px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              transform: 'translateY(40px)'
            }}>
              <div style={{ position: 'absolute', top: '-70px' }}>
                <UserAvatar name={data.top3[1].avatarSeed || data.top3[1].nombre} size={140} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#b1c6f9', fontFamily: "'Anybody', sans-serif", marginTop: '50px' }}>#2</div>
              <h3 style={{ fontSize: '24px', margin: '12px 0 4px', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.top3[1].nombre}</h3>
              <div style={{ fontSize: '40px', fontWeight: 900, color: '#00e476', fontFamily: "'Anybody', sans-serif", marginBottom: '24px' }}>{data.top3[1].puntos} PTS</div>
              
              {/* Detailed Stats Row */}
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 0', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>🎯</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.top3[1].certeros}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 0', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>📈</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.top3[1].parciales}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 0', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>📝</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.top3[1].total}</div>
                </div>
              </div>
            </div>
          )}

          {/* Posicion 1 */}
          {data.top3[0] && (
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', width: '340px',
              background: 'linear-gradient(180deg, rgba(255,204,0,0.1) 0%, rgba(255,255,255,0.03) 100%)',
              borderTop: '8px solid #ffcc00',
              border: '1px solid rgba(255,204,0,0.2)',
              borderRadius: '32px',
              padding: '50px 24px 30px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(255,204,0,0.15)',
              zIndex: 10
            }}>
              <div style={{ position: 'absolute', top: '-110px' }}>
                <span style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '60px', zIndex: 2 }}>👑</span>
                <div style={{ border: '4px solid #ffcc00', borderRadius: '50%', padding: '4px', background: '#0d1112' }}>
                  <UserAvatar name={data.top3[0].avatarSeed || data.top3[0].nombre} size={180} />
                </div>
              </div>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#ffcc00', fontFamily: "'Anybody', sans-serif", marginTop: '60px' }}>#1</div>
              <h3 style={{ fontSize: '32px', margin: '12px 0 4px', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.top3[0].nombre}</h3>
              <div style={{ fontSize: '56px', fontWeight: 900, color: '#00e476', fontFamily: "'Anybody', sans-serif", marginBottom: '32px' }}>{data.top3[0].puntos} PTS</div>
              
              {/* Detailed Stats Row */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 0', borderRadius: '16px', flex: 1, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎯</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{data.top3[0].certeros}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 0', borderRadius: '16px', flex: 1, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>📈</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{data.top3[0].parciales}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 0', borderRadius: '16px', flex: 1, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>📝</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{data.top3[0].total}</div>
                </div>
              </div>
            </div>
          )}

          {/* Posicion 3 */}
          {data.top3[2] && (
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px',
              background: 'rgba(255,255,255,0.03)',
              borderTop: '6px solid #e0e3e5',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '32px',
              padding: '40px 20px 30px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              transform: 'translateY(60px)'
            }}>
              <div style={{ position: 'absolute', top: '-60px' }}>
                <UserAvatar name={data.top3[2].avatarSeed || data.top3[2].nombre} size={120} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#e0e3e5', fontFamily: "'Anybody', sans-serif", marginTop: '50px' }}>#3</div>
              <h3 style={{ fontSize: '24px', margin: '12px 0 4px', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.top3[2].nombre}</h3>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#00e476', fontFamily: "'Anybody', sans-serif", marginBottom: '24px' }}>{data.top3[2].puntos} PTS</div>
              
              {/* Detailed Stats Row */}
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 0', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>🎯</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.top3[2].certeros}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 0', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>📈</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.top3[2].parciales}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 0', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>📝</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>{data.top3[2].total}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Stats Bottom Cards */}
        <h2 style={{ 
          fontFamily: "'Anybody', sans-serif", 
          fontSize: '24px', 
          textAlign: 'center', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          marginBottom: '24px',
          color: '#8e9099'
        }}>
          Rendimiento Global
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '24px', padding: '32px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <div style={{ fontSize: '56px', background: 'rgba(0, 229, 255, 0.1)', padding: '16px', borderRadius: '20px' }}>🎯</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, fontFamily: "'Anybody', sans-serif", color: '#00e5ff', lineHeight: 1 }}>{data.global.certeros}</div>
              <div style={{ fontSize: '16px', color: '#c5c6d0', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Certeros</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0, 228, 118, 0.2)', borderRadius: '24px', padding: '32px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <div style={{ fontSize: '56px', background: 'rgba(0, 228, 118, 0.1)', padding: '16px', borderRadius: '20px' }}>📈</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, fontFamily: "'Anybody', sans-serif", color: '#00e476', lineHeight: 1 }}>{data.global.parciales}</div>
              <div style={{ fontSize: '16px', color: '#c5c6d0', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Parciales</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(177, 198, 249, 0.2)', borderRadius: '24px', padding: '32px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <div style={{ fontSize: '56px', background: 'rgba(177, 198, 249, 0.1)', padding: '16px', borderRadius: '20px' }}>📝</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, fontFamily: "'Anybody', sans-serif", color: '#b1c6f9', lineHeight: 1 }}>{data.global.total}</div>
              <div style={{ fontSize: '16px', color: '#c5c6d0', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Pronósticos</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: '24px', color: '#8e9099', fontFamily: "'Anybody', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>
          JUEGA EN <span style={{ color: '#00e5ff' }}>PRODE2026.COM</span>
        </p>
      </footer>
    </div>
  );
});

ShareStatsImage.displayName = 'ShareStatsImage';

export default ShareStatsImage;
