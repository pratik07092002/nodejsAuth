const { error } = require("console");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(async (client) => {
    console.log("Connected to DB");
    await client.query(
      `
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
    );
    `
    );
    console.log("Table Created");
    client.release();
  })
  .catch((err) => console.error("ERror occured while Connecting", err.stack));
module.exports = pool;
