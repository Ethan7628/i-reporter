const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ireporter_db',
  multipleStatements: true // Allow multiple SQL statements
});

connection.connect(async (err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);

    // If database doesn't exist, create it
    if (err.code === 'ER_BAD_DB_ERROR') {
      await createDatabase();
      return;
    }
    return;
  }

  console.log('Connected to database as id ' + connection.threadId);
  await initializeTables();
});

async function createDatabase() {
  const tempConnection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  return new Promise((resolve, reject) => {
    tempConnection.connect((err) => {
      if (err) {
        console.error('Temp connection failed:', err);
        reject(err);
        return;
      }

      console.log('Creating database...');

      const createDBSQL = `
        CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ireporter_db'};
        USE ${process.env.DB_NAME || 'ireporter_db'};
      `;

      tempConnection.query(createDBSQL, (error) => {
        if (error) {
          console.error('Error creating database:', error);
          reject(error);
          return;
        }

        console.log('Database created successfully!');
        tempConnection.end();

        // Reconnect with database selected
        connection.config.database = process.env.DB_NAME || 'ireporter_db';
        connection.connect(async (err) => {
          if (err) {
            console.error('Reconnection failed:', err);
            reject(err);
            return;
          }
          console.log('Reconnected to database with database selected');
          await initializeTables();
          resolve();
        });
      });
    });
  });
}

async function initializeTables() {
  const createTablesSQL = `
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Create records table
    CREATE TABLE IF NOT EXISTS records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('red-flag', 'intervention') NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      status ENUM('draft', 'under-investigation', 'rejected', 'resolved') DEFAULT 'draft',
      images JSON,
      videos JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Create index for better performance
    CREATE INDEX idx_user_id ON records(user_id);
    CREATE INDEX idx_record_status ON records(status);
    CREATE INDEX idx_record_type ON records(type);

  `;

  return new Promise((resolve, reject) => {
    connection.query(createTablesSQL, (error) => {
      if (error) {
        console.error('Error creating tables:', error);
        reject(error);
        return;
      }

      console.log('Database tables verified/created successfully');
      createAdminUser().then(resolve).catch(reject);
    });
  });
}

async function createAdminUser() {
  const bcrypt = require('bcryptjs');

  const checkAdminSQL = 'SELECT id FROM users WHERE email = ?';
  const insertAdminSQL = `
    INSERT INTO users (first_name, last_name, email, password, is_admin) 
    VALUES (?, ?, ?, ?, TRUE)
  `;

  return new Promise((resolve, reject) => {
    connection.query(checkAdminSQL, ['admin@ireporter.com'], async (error, results) => {
      if (error) {
        console.error('Error checking admin user:', error);
        reject(error);
        return;
      }

      if (results.length === 0) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);

          connection.query(
            insertAdminSQL,
            ['Admin', 'User', 'admin@ireporter.com', hashedPassword],
            (error) => {
              if (error) {
                console.error('Error creating admin user:', error);
                reject(error);
                return;
              }
              console.log('✓ Admin user created successfully');
              console.log('  Email: admin@ireporter.com');
              console.log('  Password: admin123');
              resolve();
            }
          );
        } catch (hashError) {
          console.error('Error hashing password:', hashError);
          reject(hashError);
        }
      } else {
        console.log('✓ Admin user already exists');
        resolve();
      }
    });
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing database connection...');
  connection.end();
  process.exit();
});

module.exports = connection;