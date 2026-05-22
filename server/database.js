const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'biblioteca.db');

let db;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('Base de datos cargada desde archivo existente.');
  } else {
    db = new SQL.Database();
    console.log('Nueva base de datos creada.');
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('root', 'admin', 'usuario')),
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dm_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_admin'
        CHECK(status IN ('pending_admin', 'pending_user', 'active', 'resolved')),
      last_user_msg_at INTEGER NOT NULL DEFAULT 0,
      resolved_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT    PRIMARY KEY,
      book_id    INTEGER NOT NULL,
      user_id    TEXT    NOT NULL,
      user_name  TEXT    NOT NULL,
      rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment    TEXT    NOT NULL,
      status     TEXT    NOT NULL DEFAULT 'approved'
                 CHECK(status IN ('approved', 'pending', 'rejected')),
      created_at INTEGER NOT NULL,
      UNIQUE(book_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bot_conversations (
      id          TEXT    PRIMARY KEY,
      user_id     TEXT    NOT NULL,
      user_name   TEXT    NOT NULL,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bot_messages (
      id          TEXT    PRIMARY KEY,
      conv_id     TEXT    NOT NULL REFERENCES bot_conversations(id),
      sender      TEXT    NOT NULL CHECK(sender IN ('user', 'bot')),
      content     TEXT    NOT NULL,
      intent      TEXT,
      timestamp   INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dm_messages (
      id TEXT PRIMARY KEY,
      conv_id TEXT NOT NULL REFERENCES dm_conversations(id),
      sender TEXT NOT NULL CHECK(sender IN ('user', 'admin')),
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // ── Migración: asegurar que el CHECK constraint incluye 'resolved' ──
  // SQLite no admite ALTER TABLE para cambiar constraints, hay que recrear la tabla.
  const schemaResult = db.exec(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='dm_conversations'"
  );
  const needsRebuild = schemaResult.length > 0 &&
    schemaResult[0].values.length > 0 &&
    !String(schemaResult[0].values[0][0]).includes("'resolved'");

  if (needsRebuild) {
    console.log('Migración: recreando dm_conversations con constraint actualizado...');
    db.run('BEGIN TRANSACTION');
    db.run(`
      CREATE TABLE dm_conversations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_admin'
          CHECK(status IN ('pending_admin', 'pending_user', 'active', 'resolved')),
        last_user_msg_at INTEGER NOT NULL DEFAULT 0,
        resolved_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    // Copiar datos existentes mapeando columnas disponibles
    const existingCols = db.exec("PRAGMA table_info(dm_conversations)");
    const colNames = existingCols.length > 0 ? existingCols[0].values.map(r => r[1]) : [];
    const safeCols = ['id','user_id','user_name','status','created_at','updated_at']
      .filter(c => colNames.includes(c));
    if (safeCols.length > 0) {
      db.run(`INSERT INTO dm_conversations_new (${safeCols.join(',')}) SELECT ${safeCols.join(',')} FROM dm_conversations`);
    }
    db.run('DROP TABLE dm_conversations');
    db.run('ALTER TABLE dm_conversations_new RENAME TO dm_conversations');
    db.run('COMMIT');
    console.log('Migración completada: dm_conversations actualizada.');
  }

  // Seed initial users (only if they don't exist)
  const existingUsers = db.exec("SELECT COUNT(*) FROM users");
  const count = existingUsers[0].values[0][0];

  if (count === 0) {
    db.run("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)",
      ['root@gmail.com', '1234', 'root', 'Root Admin']);
    db.run("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)",
      ['admin@gmail.com', '1234', 'admin', 'Administrador']);
    db.run("INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)",
      ['usuario@gmail.com', '1234', 'usuario', 'Usuario Regular']);
    console.log('Usuarios predeterminados insertados.');
  } else {
    console.log(`Base de datos ya contiene ${count} usuarios.`);
  }

  saveDatabase();
  return db;
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb, saveDatabase };
