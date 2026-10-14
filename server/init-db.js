import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'AzanMalik7860';
const dbName = process.env.DB_NAME || 'icare_db';
const dbPort = Number(process.env.DB_PORT) || 3306;

async function checkAndCreateDatabase() {
  console.log(`Connecting to MySQL on ${dbHost}:${dbPort} as '${dbUser}'...`);
  
  try {
    // 1. Connect without selecting database
    const conn = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      port: dbPort,
    });

    // 2. Check if database exists
    const [rows] = await conn.query(`SHOW DATABASES LIKE ?`, [dbName]);
    if (rows.length === 0) {
      console.log(`Database '${dbName}' not found. Creating database '${dbName}'...`);
      await conn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${dbName}' created successfully.`);
    } else {
      console.log(`✅ Database '${dbName}' already exists.`);
    }

    await conn.end();
  } catch (err) {
    console.error(`❌ MySQL error: ${err.message}`);
    process.exit(1);
  }
}

checkAndCreateDatabase();
