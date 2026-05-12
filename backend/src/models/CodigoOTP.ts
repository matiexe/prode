import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CodigoOTPAttributes {
  id: number;
  email: string;
  codigo: string;
  expiraEn: Date;
  usado: boolean;
  createdAt?: Date;
}

export interface CodigoOTPCreationAttributes extends Optional<CodigoOTPAttributes, 'id' | 'usado' | 'createdAt'> {}

export class CodigoOTP extends Model<CodigoOTPAttributes, CodigoOTPCreationAttributes> implements CodigoOTPAttributes {
  public id!: number;
  public email!: string;
  public codigo!: string;
  public expiraEn!: Date;
  public usado!: boolean;
  public readonly createdAt!: Date;
}

CodigoOTP.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiraEn: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'codigos_otp',
    underscored: true,
    timestamps: false,
  }
);
