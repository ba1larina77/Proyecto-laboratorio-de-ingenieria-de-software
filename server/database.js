require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false }
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Conectando a Supabase / PostgreSQL...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('root', 'admin', 'usuario')),
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS dm_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_admin'
          CHECK(status IN ('pending_admin', 'pending_user', 'active', 'resolved')),
        last_user_msg_at BIGINT NOT NULL DEFAULT 0,
        resolved_at BIGINT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id         TEXT    PRIMARY KEY,
        book_id    INTEGER NOT NULL,
        user_id    TEXT    NOT NULL,
        user_name  TEXT    NOT NULL,
        rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment    TEXT    NOT NULL,
        status     TEXT    NOT NULL DEFAULT 'approved'
                   CHECK(status IN ('approved', 'pending', 'rejected')),
        created_at BIGINT NOT NULL,
        UNIQUE(book_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_conversations (
        id          TEXT    PRIMARY KEY,
        user_id     TEXT    NOT NULL,
        user_name   TEXT    NOT NULL,
        created_at  BIGINT NOT NULL,
        updated_at  BIGINT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_messages (
        id          TEXT    PRIMARY KEY,
        conv_id     TEXT    NOT NULL REFERENCES bot_conversations(id),
        sender      TEXT    NOT NULL CHECK(sender IN ('user', 'bot')),
        content     TEXT    NOT NULL,
        intent      TEXT,
        timestamp   BIGINT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS dm_messages (
        id TEXT PRIMARY KEY,
        conv_id TEXT NOT NULL REFERENCES dm_conversations(id),
        sender TEXT NOT NULL CHECK(sender IN ('user', 'admin')),
        sender_name TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp BIGINT NOT NULL
      )
    `);

    // Seed initial users
    const { rows } = await client.query("SELECT COUNT(*) FROM users");
    const count = parseInt(rows[0].count, 10);

    if (count === 0) {
      await client.query("INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4)",
        ['root@gmail.com', '1234', 'root', 'Root Admin']);
      await client.query("INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4)",
        ['admin@gmail.com', '1234', 'admin', 'Administrador']);
      await client.query("INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4)",
        ['usuario@gmail.com', '1234', 'usuario', 'Usuario Regular']);
      console.log('Usuarios predeterminados insertados.');
    } else {
      console.log(`Base de datos ya contiene ${count} usuarios.`);
    }

  } finally {
    client.release();
  }
}

function getDb() {
  return pool;
}

// Ya no hay persistencia manual para postgres
function saveDatabase() {
  // No-op for Postgres
}

module.exports = { initDatabase, getDb, saveDatabase, pool };
