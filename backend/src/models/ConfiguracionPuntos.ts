import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ConfiguracionPuntosAttributes {
  id: number;
  tipo: 'exacto' | 'diferencia' | 'ganador' | 'error';
  puntos: number;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConfiguracionPuntosCreationAttributes extends Optional<ConfiguracionPuntosAttributes, 'id' | 'activo'> {}

export class ConfiguracionPuntos extends Model<ConfiguracionPuntosAttributes, ConfiguracionPuntosCreationAttributes> implements ConfiguracionPuntosAttributes {
  public id!: number;
  public tipo!: 'exacto' | 'diferencia' | 'ganador' | 'error';
  public puntos!: number;
  public activo!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ConfiguracionPuntos.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: { name: 'uq_tipo', msg: 'Este tipo de puntuación ya existe' },
      validate: {
        isIn: { args: [['exacto', 'diferencia', 'ganador', 'error']], msg: 'Tipo de puntuacion invalido' },
      },
    },
    puntos: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'configuracion_puntos',
    underscored: true,
  }
);
