const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'biblioteca.db');

let db;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing DB or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('Base de datos cargada desde archivo existente.');
  } else {
    db = new SQL.Database();
    console.log('Nueva base de datos creada.');
  }

  // Create users table
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

  // Save to disk
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
