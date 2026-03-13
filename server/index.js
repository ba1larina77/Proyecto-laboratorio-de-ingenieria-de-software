const express = require('express');
const cors = require('cors');
const { initDatabase, getDb } = require('./database');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Correo y contraseña son requeridos'
    });
  }

  const db = getDb();
  const result = db.exec(
    "SELECT id, email, role, name FROM users WHERE email = ? AND password = ?",
    [email, password]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales incorrectas. Verifica tu correo y contraseña.'
    });
  }

  const row = result[0].values[0];
  res.json({
    success: true,
    user: {
      id: row[0],
      email: row[1],
      role: row[2],
      name: row[3]
    }
  });
});

// Start server after DB init
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
