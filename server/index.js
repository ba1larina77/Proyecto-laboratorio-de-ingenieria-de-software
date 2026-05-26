const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { initDatabase, getDb, saveDatabase } = require('./database');
const { computeRecommendations } = require('./recommendationService');
const { processMessage }        = require('./botService');

const app = express();
const server = http.createServer(app);
const PORT = 3001;

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PATCH'], credentials: true },
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── REST: Login ──────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos' });

  const db = getDb();
  const result = db.exec(
    'SELECT id, email, role, name FROM users WHERE email = ? AND password = ?',
    [email, password]
  );
  if (result.length === 0 || result[0].values.length === 0)
    return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });

  const row = result[0].values[0];
  res.json({ success: true, user: { id: row[0], email: row[1], role: row[2], name: row[3] } });
});

// ── REST: Historial de conversaciones (por usuario) ──────────
app.get('/api/direct-messages/:userId', (req, res) => {
  const db = getDb();
  const convId = `conv-${req.params.userId}`;
  const convResult = db.exec('SELECT * FROM dm_conversations WHERE id = ?', [convId]);
  if (convResult.length === 0) return res.json(null);

  const cols = convResult[0].columns;
  const conv = Object.fromEntries(cols.map((c, i) => [c, convResult[0].values[0][i]]));

  const msgResult = db.exec(
    'SELECT * FROM dm_messages WHERE conv_id = ? ORDER BY timestamp ASC', [convId]
  );
  const messages = msgResult.length > 0
    ? msgResult[0].values.map(v => Object.fromEntries(msgResult[0].columns.map((c, i) => [c, v[i]])))
    : [];

  res.json({ ...conv, messages });
});

// ── REST: Todas las conversaciones (admin) ───────────────────
app.get('/api/direct-messages', (req, res) => {
  const db = getDb();
  const convResult = db.exec('SELECT * FROM dm_conversations ORDER BY updated_at DESC');
  if (convResult.length === 0) return res.json([]);

  const convCols = convResult[0].columns;
  const convs = convResult[0].values.map(v =>
    Object.fromEntries(convCols.map((c, i) => [c, v[i]]))
  );

  const msgResult = db.exec('SELECT * FROM dm_messages ORDER BY timestamp ASC');
  const allMsgs = msgResult.length > 0
    ? msgResult[0].values.map(v => Object.fromEntries(msgResult[0].columns.map((c, i) => [c, v[i]])))
    : [];

  res.json(convs.map(c => ({ ...c, messages: allMsgs.filter(m => m.conv_id === c.id) })));
});

// ── REST: Bot de recomendaciones ─────────────────────────────
app.post('/api/bot/message', (req, res) => {
  const {
    userId, userName,
    message,
    candidateBooks      = [],
    purchasedBookIds    = [],
    purchasedAuthors    = [],
    purchasedCategories = [],
    preferences         = [],
    // Métricas de tendencias pre-calculadas por el frontend
    bestsellerIds       = [],
    topRatedIds         = [],
    newBookIds          = [],
  } = req.body ?? {};

  if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });
  if (!userId)          return res.status(400).json({ error: 'userId es requerido' });

  const userContext = {
    userId, userName,
    purchasedBookIds, purchasedAuthors, purchasedCategories, preferences,
    bestsellerIds, topRatedIds, newBookIds,
  };
  const botResponse = processMessage(message.trim(), candidateBooks, userContext);

  // Persistir en SQLite si hay userId
  if (userId) {
    const db   = getDb();
    const now  = Date.now();
    const convId = `bot-conv-${userId}`;

    // Upsert conversación
    const exists = db.exec('SELECT id FROM bot_conversations WHERE id = ?', [convId]);
    if (exists.length === 0 || exists[0].values.length === 0) {
      db.run(
        'INSERT INTO bot_conversations (id, user_id, user_name, created_at, updated_at) VALUES (?,?,?,?,?)',
        [convId, userId, userName ?? 'Usuario', now, now]
      );
    } else {
      db.run('UPDATE bot_conversations SET updated_at = ? WHERE id = ?', [now, convId]);
    }

    // Guardar mensaje del usuario
    db.run(
      'INSERT INTO bot_messages (id, conv_id, sender, content, intent, timestamp) VALUES (?,?,?,?,?,?)',
      [`bm-u-${now}`, convId, 'user', message.trim(), null, now]
    );

    // Guardar respuesta del bot
    db.run(
      'INSERT INTO bot_messages (id, conv_id, sender, content, intent, timestamp) VALUES (?,?,?,?,?,?)',
      [`bm-b-${now + 1}`, convId, 'bot', botResponse.text, botResponse.intent, now + 1]
    );

    saveDatabase();
  }

  return res.status(201).json(botResponse);
});

// ── REST: Historial del bot por usuario ──────────────────────
app.get('/api/bot/history/:userId', (req, res) => {
  const db = getDb();
  const convId = `bot-conv-${req.params.userId}`;
  const result = db.exec(
    'SELECT * FROM bot_messages WHERE conv_id = ? ORDER BY timestamp ASC',
    [convId]
  );
  if (result.length === 0) return res.json({ messages: [], total: 0 });
  const cols = result[0].columns;
  const messages = result[0].values.map(v => Object.fromEntries(cols.map((c, i) => [c, v[i]])));
  res.json({ messages, total: messages.length });
});

// ── REST: Recomendaciones personalizadas ─────────────────────
app.post('/api/recommendations', (req, res) => {
  if (!req.body?.userId) return res.status(400).json({ error: 'userId es requerido' });

  const {
    purchasedBookIds    = [],
    purchasedAuthors    = [],
    purchasedCategories = [],
    highRatedCategories = [],
    preferences         = [],
    searchTerms         = [],
    candidateBooks      = [],
  } = req.body;

  if (!Array.isArray(candidateBooks) || candidateBooks.length === 0)
    return res.json([]);

  try {
    const recommendations = computeRecommendations({
      purchasedBookIds,
      purchasedAuthors,
      purchasedCategories,
      highRatedCategories,
      preferences,
      searchTerms,
      candidateBooks,
    });
    res.json(recommendations);
  } catch (err) {
    console.error('[/api/recommendations] Error en computeRecommendations:', err.message);
    res.status(500).json({ error: 'Error al calcular recomendaciones', detail: err.message });
  }
});

// ── REST: Reseñas — obtener por libro ───────────────────────
app.get('/api/reviews/:bookId', (req, res) => {
  const db = getDb();
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) return res.status(400).json({ error: 'bookId inválido' });

  const result = db.exec(
    "SELECT * FROM reviews WHERE book_id = ? AND status = 'approved' ORDER BY created_at DESC",
    [bookId]
  );
  if (result.length === 0) return res.json({ reviews: [], avg: null, total: 0 });

  const cols = result[0].columns;
  const reviews = result[0].values.map(v =>
    Object.fromEntries(cols.map((c, i) => [c, v[i]]))
  );

  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  res.json({ reviews, avg: avg ? Math.round(avg * 10) / 10 : null, total: reviews.length });
});

// ── REST: Reseñas — crear ───────────────────────────────────
app.post('/api/reviews', (req, res) => {
  const { bookId, userId, userName, rating, comment } = req.body;

  if (!bookId || !userId || !userName || !comment) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La calificación debe ser un entero entre 1 y 5' });
  }

  const db = getDb();

  // Comprobar si el usuario ya reseñó este libro
  const existing = db.exec(
    'SELECT id FROM reviews WHERE book_id = ? AND user_id = ?',
    [bookId, userId]
  );
  if (existing.length > 0 && existing[0].values.length > 0) {
    return res.status(409).json({ error: 'Ya escribiste una reseña para este libro' });
  }

  const id = `rv-${userId}-${bookId}-${Date.now()}`;
  const now = Date.now();

  db.run(
    'INSERT INTO reviews (id, book_id, user_id, user_name, rating, comment, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, bookId, userId, userName, rating, comment.trim(), 'approved', now]
  );
  saveDatabase();

  res.status(201).json({
    review: { id, bookId, userId, userName, rating, comment: comment.trim(), status: 'approved', createdAt: now }
  });
});

// ── REST: Resolver conversación ──────────────────────────────
app.patch('/api/direct-messages/:convId/resolve', (req, res) => {
  const db = getDb();
  const { convId } = req.params;
  const now = Date.now();
  db.run(
    "UPDATE dm_conversations SET status = 'resolved', resolved_at = ?, updated_at = ? WHERE id = ?",
    [now, now, convId]
  );
  saveDatabase();
  res.json({ success: true, resolvedAt: now });
});

// ── Helpers DB ───────────────────────────────────────────────
function upsertConversation(db, convId, userId, userName, status, now, lastUserMsgAt) {
  const exists = db.exec('SELECT id FROM dm_conversations WHERE id = ?', [convId]);
  if (exists.length > 0 && exists[0].values.length > 0) {
    if (lastUserMsgAt !== undefined) {
      db.run(
        'UPDATE dm_conversations SET status = ?, last_user_msg_at = ?, updated_at = ? WHERE id = ?',
        [status, lastUserMsgAt, now, convId]
      );
    } else {
      db.run(
        'UPDATE dm_conversations SET status = ?, updated_at = ? WHERE id = ?',
        [status, now, convId]
      );
    }
  } else {
    db.run(
      'INSERT INTO dm_conversations (id, user_id, user_name, status, last_user_msg_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [convId, userId, userName, status, lastUserMsgAt ?? 0, now, now]
    );
  }
}

function insertMessage(db, msgId, convId, sender, senderName, content, timestamp) {
  db.run(
    'INSERT OR IGNORE INTO dm_messages (id, conv_id, sender, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    [msgId, convId, sender, senderName, content, timestamp]
  );
}

// ── SOCKET.IO ────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('identify', ({ userId, role }) => {
    if (role === 'admin' || role === 'root') {
      socket.join('admin:all');
    } else if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // Usuario envía mensaje
  socket.on('direct:send', ({ convId, msgId, userId, userName, content, timestamp }) => {
    const db = getDb();
    // last_user_msg_at = timestamp actual (inicia o actualiza el reloj de urgencia)
    upsertConversation(db, convId, userId, userName, 'pending_admin', timestamp, timestamp);
    insertMessage(db, msgId, convId, 'user', userName, content, timestamp);
    saveDatabase();

    const dmMsg = { id: msgId, sender: 'user', senderName: userName, content, timestamp };
    io.to('admin:all').emit('direct:new_msg', { convId, userId, userName, dmMsg });
  });

  // Admin envía mensaje
  socket.on('direct:admin_send', ({ convId, msgId, adminId, adminName, userId, userName, content, timestamp }) => {
    const db = getDb();
    // Resetear last_user_msg_at = 0 (la urgencia desaparece al responder)
    upsertConversation(db, convId, userId, userName, 'pending_user', timestamp, 0);
    insertMessage(db, msgId, convId, 'admin', adminName, content, timestamp);
    saveDatabase();

    const dmMsg = { id: msgId, sender: 'admin', senderName: adminName, content, timestamp };
    io.to(`user:${userId}`).emit('direct:admin_msg', { convId, userId, userName, dmMsg });
    socket.to('admin:all').emit('direct:admin_msg', { convId, userId, userName, dmMsg });
  });

  // Marcar como leída
  socket.on('direct:read', ({ convId, readerId, readerRole }) => {
    const db = getDb();
    db.run("UPDATE dm_conversations SET status = 'active', updated_at = ? WHERE id = ?", [Date.now(), convId]);
    saveDatabase();

    io.to('admin:all').emit('direct:read_ack', { convId });
    const result = db.exec('SELECT user_id FROM dm_conversations WHERE id = ?', [convId]);
    if (result.length > 0 && result[0].values.length > 0) {
      const uid = result[0].values[0][0];
      io.to(`user:${uid}`).emit('direct:read_ack', { convId });
    }
  });

  // Admin resuelve la conversación
  socket.on('direct:resolve', ({ convId }) => {
    const db = getDb();
    const now = Date.now();
    db.run(
      "UPDATE dm_conversations SET status = 'resolved', resolved_at = ?, updated_at = ? WHERE id = ?",
      [now, now, convId]
    );
    saveDatabase();

    // Notificar a todos (admin + usuario)
    io.to('admin:all').emit('direct:resolved', { convId, resolvedAt: now });
    const result = db.exec('SELECT user_id FROM dm_conversations WHERE id = ?', [convId]);
    if (result.length > 0 && result[0].values.length > 0) {
      const uid = result[0].values[0][0];
      io.to(`user:${uid}`).emit('direct:resolved', { convId, resolvedAt: now });
    }
  });
});

// ── START ────────────────────────────────────────────────────
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
