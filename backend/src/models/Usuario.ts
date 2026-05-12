import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UsuarioAttributes {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'user';
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'rol' | 'activo'> {}

export class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public id!: number;
  public nombre!: string;
  public email!: string;
  public rol!: 'admin' | 'user';
  public activo!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre es requerido' },
        len: { args: [3, 100], msg: 'El nombre debe tener entre 3 y 100 caracteres' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { name: 'uq_email', msg: 'El email ya está registrado' },
      validate: {
        isEmail: { msg: 'Email inválido' },
      },
    },
    rol: {
      type: DataTypes.STRING(10),
      defaultValue: 'user',
      allowNull: false,
      validate: {
        isIn: { args: [['admin', 'user']], msg: 'Rol invalido' },
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'usuarios',
    underscored: true,
  }
);
