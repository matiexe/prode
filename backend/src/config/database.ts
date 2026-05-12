import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL;

export const sequelize = connectionString
  ? new Sequelize(connectionString, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(
      process.env.DB_NAME || 'prode_mundial_2026',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
          timestamps: true,
          underscored: true,
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Conexion a Postgres establecida correctamente.');
  } catch (error) {
    console.error('Error al conectar con Postgres:', error);
    throw error;
  }
}
