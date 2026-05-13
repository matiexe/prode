import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PartidoAttributes {
  id: number;
  fase: 'grupos' | '16vos' | '8vos' | 'cuartos' | 'semis' | '3er_puesto' | 'final';
  grupo: string | null;
  equipoLocal: string;
  equipoVisitante: string;
  fechaHora: Date;
  golesLocal: number | null;
  golesVisitante: number | null;
  ganadorNombre: string | null;
  estado: 'pendiente' | 'jugando' | 'finalizado';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PartidoCreationAttributes extends Optional<PartidoAttributes, 'id' | 'golesLocal' | 'golesVisitante' | 'ganadorNombre' | 'estado'> {}

export class Partido extends Model<PartidoAttributes, PartidoCreationAttributes> implements PartidoAttributes {
  public id!: number;
  public fase!: 'grupos' | '16vos' | '8vos' | 'cuartos' | 'semis' | '3er_puesto' | 'final';
  public grupo!: string | null;
  public equipoLocal!: string;
  public equipoVisitante!: string;
  public fechaHora!: Date;
  public golesLocal!: number | null;
  public golesVisitante!: number | null;
  public ganadorNombre!: string | null;
  public estado!: 'pendiente' | 'jugando' | 'finalizado';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Partido.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fase: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: { args: [['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final']], msg: 'Fase invalida' },
      },
    },
    grupo: {
      type: DataTypes.CHAR(1),
      allowNull: true,
    },
    equipoLocal: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    equipoVisitante: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fechaHora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    golesLocal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    golesVisitante: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ganadorNombre: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'pendiente',
      allowNull: false,
      validate: {
        isIn: { args: [['pendiente', 'jugando', 'finalizado']], msg: 'Estado invalido' },
      },
    },
  },
  {
    sequelize,
    tableName: 'partidos',
    underscored: true,
  }
);
