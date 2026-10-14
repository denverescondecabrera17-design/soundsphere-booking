const sql = require('mssql');
require('dotenv').config();

const configs = [
  {
    name: 'MonsterASP',
    server: 'db72897.public.databaseasp.net',
    user: 'db72897',
    password: 'o#7C?9Bb3Ei_',
    database: 'db72897',
    options: { encrypt: false, trustServerCertificate: true }
  },
  {
    name: 'Local',
    server: '127.0.0.1',
    user: 'sa',
    password: process.env.DB_PASSWORD || 'Denver12345!',
    database: 'SoundSphereDB',
    options: { encrypt: false, trustServerCertificate: true }
  }
];

async function check() {
  for (const cfg of configs) {
    try {
      console.log('Connecting to', cfg.name);
      const pool = await sql.connect(cfg);
      const provs = await pool.request().query("SELECT * FROM Providers WHERE BusinessName LIKE '%AG Lights%' OR OwnerName LIKE '%Angelo%'");
      console.log(cfg.name, 'Providers:', JSON.stringify(provs.recordset, null, 2));
      if (provs.recordset.length > 0) {
        const uid = provs.recordset[0].UserID;
        const users = await pool.request().query("SELECT * FROM Users WHERE UserID = " + uid);
        console.log(cfg.name, 'User:', JSON.stringify(users.recordset, null, 2));
      }
      await pool.close();
    } catch (e) {
      console.log(cfg.name, 'Error:', e.message);
    }
  }
}
check();
