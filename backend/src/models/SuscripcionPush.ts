import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Usuario } from './Usuario';

export interface SuscripcionPushAttributes {
  id: number;
  usuarioId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SuscripcionPushCreationAttributes extends Optional<SuscripcionPushAttributes, 'id'> {}

export class SuscripcionPush extends Model<SuscripcionPushAttributes, SuscripcionPushCreationAttributes> implements SuscripcionPushAttributes {
  declare id: number;
  declare usuarioId: number;
  declare endpoint: string;
  declare p256dh: string;
  declare auth: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SuscripcionPush.init(
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
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    p256dh: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    auth: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'suscripciones_push',
    underscored: true,
  }
);

Usuario.hasMany(SuscripcionPush, { foreignKey: 'usuarioId', as: 'suscripcionesPush' });
SuscripcionPush.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
