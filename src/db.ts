import  "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";



const pool = new Pool({
  connectionString: process.env.DB_URL,
});

async function connectToDatabase() {
  try {
    await pool.connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

connectToDatabase();

const db = drizzle(pool);

export default db;