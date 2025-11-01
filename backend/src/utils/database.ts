import mysql from 'mysql2/promise';

// Create MySQL connection pool with proper SSL handling
const poolConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'ireporter',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Kusasirakwe0742128488ethan',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Handle SSL configuration properly for MySQL
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  poolConfig.ssl = false;
}

const pool = mysql.createPool(poolConfig);

export const query = async (text: string, params?: any[]) => {
  try {
    const [rows, fields] = await pool.execute(text, params);
    return { rows, fields };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  return await pool.getConnection();
};

// Test database connection
export const testConnection = async () => {
  let connection;
  try {
    // Debug: Check if environment variables are loaded
    console.log('🔧 Checking environment variables...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
    
    if (!process.env.DB_PASSWORD) {
      throw new Error('DB_PASSWORD is undefined or empty');
    }
    
    connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('✅ Test query executed successfully:', rows);
    
    return true;
  } catch (err: any) {
    console.error('❌ MySQL Database connection failed:', err.message);
    console.error('Error details:', err);
    
    if (err.code) {
      console.error('Error code:', err.code);
    }
    
    // Provide helpful error messages based on common MySQL issues
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Tip: Check your MySQL username and password');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Make sure MySQL server is running on the specified host and port');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Tip: The database does not exist. Create it first: CREATE DATABASE ireporter;');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};