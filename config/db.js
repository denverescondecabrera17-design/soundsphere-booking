/**
 * Database Configuration & Connection Pool
 * Technology: Microsoft SQL Server via 'mssql' package
 */

const sql = require('mssql');
require('dotenv').config();

const isAzure = (process.env.DB_SERVER && process.env.DB_SERVER.toLowerCase().includes('.database.windows.net'));
const isProduction = process.env.NODE_ENV === 'production';
const shouldEncrypt = process.env.DB_ENCRYPT !== undefined 
    ? process.env.DB_ENCRYPT === 'true' 
    : (isAzure || isProduction);

const trustCert = process.env.DB_TRUST_CERT !== undefined 
    ? process.env.DB_TRUST_CERT === 'true' 
    : (!isAzure);

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'SoundSphereDB',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: shouldEncrypt,
        trustServerCertificate: trustCert,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Global pool connection reference
let pool = null;

/**
 * Connect to Microsoft SQL Server
 * @returns {Promise<sql.ConnectionPool>} Connected Pool
 */
const connectDB = async () => {
    try {
        if (!pool) {
            pool = await sql.connect(dbConfig);
            console.log(' Successfully connected to Microsoft SQL Server database:', process.env.DB_DATABASE);
        }
        return pool;
    } catch (error) {
        console.error(' Database Connection Failed:', error.message);
        throw error;
    }
};

/**
 * Get active SQL connection pool instance
 * @returns {sql.ConnectionPool}
 */
const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized. Call connectDB first.');
    }
    return pool;
};

module.exports = {
    sql,
    connectDB,
    getPool
};
