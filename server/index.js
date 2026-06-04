const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { initDatabase, getDb, saveDatabase } = require('./database');
const { computeRecommendations } = require('./recommendationService');
const { processMessage }        = require('./botService');

const app = express();
const server = http.createServer(app);
// Puerto: en producción el host (Render, etc.) lo asigna por process.env.PORT.
const PORT = process.env.PORT || 3001;

// Orígenes permitidos por CORS. En local: Vite (5173). En producción, define
// la variable de entorno CLIENT_URL con el dominio del frontend (ej.
// https://biblion.vercel.app). Acepta varios separados por coma.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH'], credentials: true },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ── REST: Login ──────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos' });

  try {
    const db = getDb();
    const result = await db.query(
      'SELECT id, email, role, name FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });

    const row = result.rows[0];
    res.json({ success: true, user: { id: row.id, email: row.email, role: row.role, name: row.name } });
  } catch (error) {
    console.error('Error en /api/login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// ── REST: Historial de conversaciones (por usuario) ──────────
app.get('/api/direct-messages/:userId', async (req, res) => {
  try {
    const db = getDb();
    const convId = `conv-${req.params.userId}`;
    const convResult = await db.query('SELECT * FROM dm_conversations WHERE id = $1', [convId]);
    if (convResult.rows.length === 0) return res.json(null);

    const conv = convResult.rows[0];

    const msgResult = await db.query(
      'SELECT * FROM dm_messages WHERE conv_id = $1 ORDER BY timestamp ASC', [convId]
    );
    const messages = msgResult.rows;

    const formattedConv = {
      id: conv.id,
      userId: conv.user_id,
      user_id: conv.user_id,
      userName: conv.user_name,
      user_name: conv.user_name,
      status: conv.status,
      lastUserMsgAt: conv.last_user_msg_at ? Number(conv.last_user_msg_at) : 0,
      last_user_msg_at: conv.last_user_msg_at ? Number(conv.last_user_msg_at) : 0,
      resolvedAt: conv.resolved_at ? Number(conv.resolved_at) : null,
      resolved_at: conv.resolved_at ? Number(conv.resolved_at) : null,
      createdAt: conv.created_at ? Number(conv.created_at) : 0,
      created_at: conv.created_at ? Number(conv.created_at) : 0,
      updatedAt: conv.updated_at ? Number(conv.updated_at) : 0,
      updated_at: conv.updated_at ? Number(conv.updated_at) : 0
    };

    const formattedMessages = messages.map(m => ({
      id: m.id,
      convId: m.conv_id,
      conv_id: m.conv_id,
      sender: m.sender,
      senderName: m.sender_name,
      sender_name: m.sender_name,
      content: m.content,
      timestamp: m.timestamp ? Number(m.timestamp) : 0
    }));

    res.json({ ...formattedConv, messages: formattedMessages });
  } catch (error) {
    console.error('Error en /api/direct-messages/:userId:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ── REST: Todas las conversaciones (admin) ───────────────────
app.get('/api/direct-messages', async (req, res) => {
  try {
    const db = getDb();
    const convResult = await db.query('SELECT * FROM dm_conversations ORDER BY updated_at DESC');
    const convs = convResult.rows;

    const msgResult = await db.query('SELECT * FROM dm_messages ORDER BY timestamp ASC');
    const allMsgs = msgResult.rows;

    const formattedConvs = convs.map(c => ({
      id: c.id,
      userId: c.user_id,
      user_id: c.user_id,
      userName: c.user_name,
      user_name: c.user_name,
      status: c.status,
      lastUserMsgAt: c.last_user_msg_at ? Number(c.last_user_msg_at) : 0,
      last_user_msg_at: c.last_user_msg_at ? Number(c.last_user_msg_at) : 0,
      resolvedAt: c.resolved_at ? Number(c.resolved_at) : null,
      resolved_at: c.resolved_at ? Number(c.resolved_at) : null,
      createdAt: c.created_at ? Number(c.created_at) : 0,
      created_at: c.created_at ? Number(c.created_at) : 0,
      updatedAt: c.updated_at ? Number(c.updated_at) : 0,
      updated_at: c.updated_at ? Number(c.updated_at) : 0,
      messages: allMsgs
        .filter(m => m.conv_id === c.id)
        .map(m => ({
          id: m.id,
          convId: m.conv_id,
          conv_id: m.conv_id,
          sender: m.sender,
          senderName: m.sender_name,
          sender_name: m.sender_name,
          content: m.content,
          timestamp: m.timestamp ? Number(m.timestamp) : 0
        }))
    }));

    res.json(formattedConvs);
  } catch (error) {
    console.error('Error en /api/direct-messages:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ── REST: Bot de recomendaciones ─────────────────────────────
app.post('/api/bot/message', async (req, res) => {
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

  if (userId) {
    try {
      const db   = getDb();
      const now  = Date.now();
      const convId = `bot-conv-${userId}`;

      // Upsert conversación
      await db.query(
        `INSERT INTO bot_conversations (id, user_id, user_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET updated_at = $5`,
        [convId, userId, userName ?? 'Usuario', now, now]
      );

      // Guardar mensaje del usuario
      const suffix = Math.random().toString(36).substring(2, 9);
      await db.query(
        'INSERT INTO bot_messages (id, conv_id, sender, content, intent, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
        [`bm-u-${now}-${suffix}`, convId, 'user', message.trim(), null, now]
      );

      // Guardar respuesta del bot
      await db.query(
        'INSERT INTO bot_messages (id, conv_id, sender, content, intent, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
        [`bm-b-${now + 1}-${suffix}`, convId, 'bot', botResponse.text, botResponse.intent, now + 1]
      );
    } catch (dbErr) {
      console.error('Error al persistir conversación del bot:', dbErr);
    }
  }

  return res.status(201).json(botResponse);
});

// ── REST: Historial del bot por usuario ──────────────────────
app.get('/api/bot/history/:userId', async (req, res) => {
  try {
    const db = getDb();
    const convId = `bot-conv-${req.params.userId}`;
    const result = await db.query(
      'SELECT * FROM bot_messages WHERE conv_id = $1 ORDER BY timestamp ASC',
      [convId]
    );
    const messages = result.rows.map(m => ({
      id: m.id,
      convId: m.conv_id,
      conv_id: m.conv_id,
      sender: m.sender,
      content: m.content,
      intent: m.intent,
      timestamp: m.timestamp ? Number(m.timestamp) : 0
    }));
    res.json({ messages, total: messages.length });
  } catch (error) {
    console.error('Error en /api/bot/history/:userId:', error);
    res.status(500).json({ error: 'Error al obtener historial del bot' });
  }
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
app.get('/api/reviews/:bookId', async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) return res.status(400).json({ error: 'bookId inválido' });

  try {
    const db = getDb();
    const result = await db.query(
      "SELECT * FROM reviews WHERE book_id = $1 AND status = 'approved' ORDER BY created_at DESC",
      [bookId]
    );

    const reviews = result.rows.map(row => ({
      id: row.id,
      bookId: row.book_id,
      book_id: row.book_id,
      userId: row.user_id,
      user_id: row.user_id,
      userName: row.user_name,
      user_name: row.user_name,
      rating: row.rating,
      comment: row.comment,
      status: row.status,
      createdAt: Number(row.created_at),
      created_at: Number(row.created_at)
    }));

    const avg = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

    res.json({ reviews, avg: avg ? Math.round(avg * 10) / 10 : null, total: reviews.length });
  } catch (error) {
    console.error('Error en GET /api/reviews/:bookId:', error);
    res.status(500).json({ error: 'Error al obtener reseñas del libro' });
  }
});

// ── REST: Reseñas — crear ───────────────────────────────────
app.post('/api/reviews', async (req, res) => {
  const { bookId, userId, userName, rating, comment } = req.body;

  if (!bookId || !userId || !userName || !comment) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La calificación debe ser un entero entre 1 y 5' });
  }

  try {
    const db = getDb();

    // Comprobar si el usuario ya reseñó este libro
    const existing = await db.query(
      'SELECT id FROM reviews WHERE book_id = $1 AND user_id = $2',
      [bookId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya escribiste una reseña para este libro' });
    }

    const id = `rv-${userId}-${bookId}-${Date.now()}`;
    const now = Date.now();

    await db.query(
      'INSERT INTO reviews (id, book_id, user_id, user_name, rating, comment, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, bookId, userId, userName, rating, comment.trim(), 'approved', now]
    );

    res.status(201).json({
      review: { id, bookId, userId, userName, rating, comment: comment.trim(), status: 'approved', createdAt: now }
    });
  } catch (error) {
    console.error('Error en POST /api/reviews:', error);
    res.status(500).json({ error: 'Error interno al guardar la reseña' });
  }
});

// ── REST: Resolver conversación ──────────────────────────────
app.patch('/api/direct-messages/:convId/resolve', async (req, res) => {
  try {
    const db = getDb();
    const { convId } = req.params;
    const now = Date.now();
    await db.query(
      "UPDATE dm_conversations SET status = 'resolved', resolved_at = $1, updated_at = $1 WHERE id = $2",
      [now, convId]
    );
    res.json({ success: true, resolvedAt: now });
  } catch (error) {
    console.error('Error en /api/direct-messages/:convId/resolve:', error);
    res.status(500).json({ error: 'Error interno al resolver conversación' });
  }
});

// ── Helpers DB ───────────────────────────────────────────────
async function upsertConversation(db, convId, userId, userName, status, now, lastUserMsgAt) {
  if (lastUserMsgAt !== undefined) {
    await db.query(
      `INSERT INTO dm_conversations (id, user_id, user_name, status, last_user_msg_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, last_user_msg_at = EXCLUDED.last_user_msg_at, updated_at = EXCLUDED.updated_at`,
      [convId, userId, userName, status, lastUserMsgAt, now]
    );
  } else {
    await db.query(
      `INSERT INTO dm_conversations (id, user_id, user_name, status, last_user_msg_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, $5, $5)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
      [convId, userId, userName, status, now]
    );
  }
}

async function insertMessage(db, msgId, convId, sender, senderName, content, timestamp) {
  await db.query(
    'INSERT INTO dm_messages (id, conv_id, sender, sender_name, content, timestamp) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
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
  socket.on('direct:send', async ({ convId, msgId, userId, userName, content, timestamp }) => {
    try {
      const db = getDb();
      // last_user_msg_at = timestamp actual (inicia o actualiza el reloj de urgencia)
      await upsertConversation(db, convId, userId, userName, 'pending_admin', timestamp, timestamp);
      await insertMessage(db, msgId, convId, 'user', userName, content, timestamp);

      const dmMsg = { id: msgId, sender: 'user', senderName: userName, content, timestamp };
      io.to('admin:all').emit('direct:new_msg', { convId, userId, userName, dmMsg });
    } catch (err) {
      console.error('Error en socket direct:send:', err);
    }
  });

  // Admin envía mensaje
  socket.on('direct:admin_send', async ({ convId, msgId, adminId, adminName, userId, userName, content, timestamp }) => {
    try {
      const db = getDb();
      // Resetear last_user_msg_at = 0 (la urgencia desaparece al responder)
      await upsertConversation(db, convId, userId, userName, 'pending_user', timestamp, 0);
      await insertMessage(db, msgId, convId, 'admin', adminName, content, timestamp);

      const dmMsg = { id: msgId, sender: 'admin', senderName: adminName, content, timestamp };
      io.to(`user:${userId}`).emit('direct:admin_msg', { convId, userId, userName, dmMsg });
      socket.to('admin:all').emit('direct:admin_msg', { convId, userId, userName, dmMsg });
    } catch (err) {
      console.error('Error en socket direct:admin_send:', err);
    }
  });

  // Marcar como leída
  socket.on('direct:read', async ({ convId, readerId, readerRole }) => {
    try {
      const db = getDb();
      const now = Date.now();
      await db.query("UPDATE dm_conversations SET status = 'active', updated_at = $1 WHERE id = $2", [now, convId]);

      io.to('admin:all').emit('direct:read_ack', { convId });
      const result = await db.query('SELECT user_id FROM dm_conversations WHERE id = $1', [convId]);
      if (result.rows.length > 0) {
        const uid = result.rows[0].user_id;
        io.to(`user:${uid}`).emit('direct:read_ack', { convId });
      }
    } catch (err) {
      console.error('Error en socket direct:read:', err);
    }
  });

  // Admin resuelve la conversación
  socket.on('direct:resolve', async ({ convId }) => {
    try {
      const db = getDb();
      const now = Date.now();
      await db.query(
        "UPDATE dm_conversations SET status = 'resolved', resolved_at = $1, updated_at = $1 WHERE id = $2",
        [now, convId]
      );

      // Notificar a todos (admin + usuario)
      io.to('admin:all').emit('direct:resolved', { convId, resolvedAt: now });
      const result = await db.query('SELECT user_id FROM dm_conversations WHERE id = $1', [convId]);
      if (result.rows.length > 0) {
        const uid = result.rows[0].user_id;
        io.to(`user:${uid}`).emit('direct:resolved', { convId, resolvedAt: now });
      }
    } catch (err) {
      console.error('Error en socket direct:resolve:', err);
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
