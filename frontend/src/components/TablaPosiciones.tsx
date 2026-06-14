import UserAvatar from './UserAvatar';
import type { RankingEntry } from '../types';

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
                  <UserAvatar name={entry.nombre} size={36} />
                  <span className="ranking-user-name">{entry.nombre}</span>
                </div>
              </td>
              <td className="ranking-pts">{entry.puntos.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
