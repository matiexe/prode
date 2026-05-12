import type { RankingEntry } from '../types';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface TablaPosicionesProps {
  ranking: RankingEntry[];
  loading?: boolean;
}

export default function TablaPosiciones({ ranking, loading }: TablaPosicionesProps) {
  if (loading) {
    return <div className="loading">Cargando ranking...</div>;
  }

  if (ranking.length === 0) {
    return <div className="empty">Aun no hay puntajes registrados</div>;
  }

  return (
    <div className="ranking-table-container">
      <table className="ranking-table">
        <tbody>
          {ranking.map((entry) => (
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
                <span className="ranking-aciertos">{entry.pronosticos} PRONOSTICOS</span>
              </td>
              <td className="ranking-pts">{entry.puntos.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
