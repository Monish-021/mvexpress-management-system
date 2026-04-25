const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function neonQuery(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

module.exports = {
  pool,
  neonQuery
};