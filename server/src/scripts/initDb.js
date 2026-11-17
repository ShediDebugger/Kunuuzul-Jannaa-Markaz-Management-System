require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDb() {
  console.log('Connecting to MySQL host:', process.env.DB_HOST || 'localhost');
  
  // Connect without database first to ensure database can be created
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    console.log('Reading schema file from:', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await connection.query(schemaSql);
    console.log('Schema executed successfully.');

    console.log('Reading seed file from:', seedPath);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed data...');
    await connection.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDb();
