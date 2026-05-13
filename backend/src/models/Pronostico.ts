import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Usuario } from './Usuario';
import { Partido } from './Partido';

export interface PronosticoAttributes {
  id: number;
  usuarioId: number;
  partidoId: number;
  golesLocal: number;
  golesVisitante: number;
  puntosObtenidos: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PronosticoCreationAttributes extends Optional<PronosticoAttributes, 'id' | 'puntosObtenidos'> {}

export class Pronostico extends Model<PronosticoAttributes, PronosticoCreationAttributes> implements PronosticoAttributes {
  public id!: number;
  public usuarioId!: number;
  public partidoId!: number;
  public golesLocal!: number;
  public golesVisitante!: number;
  public puntosObtenidos!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Pronostico.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: 'id' },
    },
    partidoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Partido, key: 'id' },
    },
    golesLocal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    golesVisitante: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    puntosObtenidos: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'pronosticos',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['usuario_id', 'partido_id'],
        name: 'uq_usuario_partido',
      },
    ],
  }
);

Usuario.hasMany(Pronostico, { foreignKey: 'usuarioId' });
Pronostico.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Partido.hasMany(Pronostico, { foreignKey: 'partidoId', as: 'pronosticos' });
Pronostico.belongsTo(Partido, { foreignKey: 'partidoId', as: 'partido' });
