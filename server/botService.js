/**
 * BotService — Clasificador de intenciones + matcher de libros
 *
 * Intenciones soportadas:
 *   GREETING        → saludo inicial
 *   HELP            → ¿qué puedes hacer?
 *   GENRE           → "recomienda ciencia ficción"
 *   AUTHOR          → "libros de García Márquez"
 *   SIMILAR         → "algo similar a X"
 *   PRICE           → "menos de X pesos"
 *   NEW             → "libros nuevos / novedades"
 *   AVAILABLE       → "libros disponibles"
 *   PERSONAL        → "qué me recomiendas" (usa historial)
 *   UNKNOWN         → no se detectó intención clara
 *
 * Intenciones de Tendencias (Iteración 4 — HU3):
 *   TRENDING        → "tendencias", "qué está de moda"
 *   BESTSELLERS     → "más vendidos", "bestsellers"
 *   TOP_RATED       → "mejor calificados", "mejor valorados"
 *   NEW_RELEASES    → "novedades recientes", "últimos lanzamientos"
 */

// ── Mapas de palabras clave ────────────────────────────────────

const GENRE_KEYWORDS = {
  'ciencia ficción': ['ciencia ficcion', 'ciencia ficción', 'sci-fi', 'scifi', 'space opera', 'futuro', 'robots', 'tecnología'],
  'fantasía':        ['fantasia', 'fantasía', 'magia', 'dragones', 'elfos', 'brujería', 'hechizos'],
  'terror':          ['terror', 'horror', 'miedo', 'suspenso', 'escalofrio', 'escalofríos', 'oscuro'],
  'romance':         ['romance', 'amor', 'amoroso', 'pareja', 'novela romántica'],
  'historia':        ['historia', 'histórico', 'historico', 'guerra', 'antiguo', 'medieval'],
  'misterio':        ['misterio', 'detective', 'crimen', 'policial', 'investigacion', 'investigación'],
  'ciencia':         ['ciencia', 'física', 'fisica', 'biología', 'biologia', 'química', 'astronomía'],
  'filosofía':       ['filosofia', 'filosofía', 'ética', 'existencialismo', 'kant', 'platón'],
  'poesía':          ['poesia', 'poesía', 'poemas', 'versos', 'lírica'],
  'biografía':       ['biografia', 'biografía', 'autobiografía', 'memorias', 'vida de'],
  'tecnología':      ['tecnología', 'tecnologia', 'programacion', 'programación', 'software', 'código'],
  'aventura':        ['aventura', 'exploración', 'exploracion', 'viaje', 'acción'],
  'clásico':         ['clasico', 'clásico', 'literatura clásica', 'clásicos'],
};

const GREETING_WORDS  = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'buenas', 'hey', 'saludos', 'buen día'];
const HELP_WORDS      = ['ayuda', 'help', 'qué puedes', 'que puedes', 'cómo funciona', 'como funciona', 'qué haces', 'para qué sirves'];
const SIMILAR_WORDS   = ['similar', 'parecido', 'como', 'igual que', 'del mismo', 'estilo de'];
const PERSONAL_WORDS  = ['recomiéndame', 'recomiendame', 'qué recomiendas', 'que recomiendas', 'sugerencia', 'sugiéreme', 'sugerir', 'para mi', 'para mí', 'personaliz'];
const NEW_WORDS       = ['nuevo', 'nuevos', 'novedades', 'reciente', 'recientes', 'novedad', 'lanzamiento'];
const AVAILABLE_WORDS    = ['disponible', 'disponibles', 'en stock', 'tenéis', 'tienen', 'hay'];
const TRENDING_WORDS     = ['tendencia', 'tendencias', 'de moda', 'popular', 'populares', 'en tendencia', 'trending'];
const BESTSELLER_WORDS   = ['mas vendido', 'más vendido', 'bestseller', 'best seller', 'mas comprado', 'más comprado', 'ventas', 'superventas'];
const TOP_RATED_WORDS    = ['mejor calificado', 'mejor valorado', 'mejor puntuado', 'mayor calificacion', 'mayor puntuacion', 'estrellas', 'mejor reseñado', 'peor calificado'];
const NEW_RELEASE_WORDS  = ['novedad reciente', 'novedades recientes', 'ultimo lanzamiento', 'último lanzamiento', 'recien llegado', 'recién llegado', 'lanzamiento reciente', 'nuevo en catalogo', 'nuevo en catálogo'];

const PRICE_REGEX    = /(\d[\d.,]*)\s*(pesos?|cop|€|\$)?/i;
const PRICE_LESS     = /menos de|por debajo de|hasta|máximo|maximo|no más de|no mas de/i;
const PRICE_MORE     = /más de|por encima de|mínimo|minimo|desde/i;
const AUTHOR_REGEX   = /(?:de|del autor|libros de|autor|escritor|escrito por)\s+([A-Za-záéíóúÁÉÍÓÚüÜñÑ][A-Za-záéíóúÁÉÍÓÚüÜñÑ\s]{2,40})/i;

// ── Extracción de intención ────────────────────────────────────

function extractIntent(message) {
  const low = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Saludo
  if (GREETING_WORDS.some(w => low.includes(w))) {
    return { type: 'GREETING' };
  }

  // Ayuda
  if (HELP_WORDS.some(w => low.includes(w))) {
    return { type: 'HELP' };
  }

  // Tendencias de nivel específico (orden: más específico primero)
  if (BESTSELLER_WORDS.some(w => low.includes(w))) {
    return { type: 'BESTSELLERS' };
  }
  if (TOP_RATED_WORDS.some(w => low.includes(w))) {
    return { type: 'TOP_RATED' };
  }
  if (NEW_RELEASE_WORDS.some(w => low.includes(w))) {
    return { type: 'NEW_RELEASES' };
  }
  if (TRENDING_WORDS.some(w => low.includes(w))) {
    return { type: 'TRENDING' };
  }

  // Personal
  if (PERSONAL_WORDS.some(w => low.includes(w))) {
    return { type: 'PERSONAL' };
  }

  // Autor
  const authorMatch = AUTHOR_REGEX.exec(message);
  if (authorMatch) {
    return { type: 'AUTHOR', value: authorMatch[1].trim() };
  }

  // Similar
  const similarIdx = SIMILAR_WORDS.findIndex(w => low.includes(w));
  if (similarIdx !== -1) {
    // Extraer el título después de la palabra clave
    const keyword = SIMILAR_WORDS[similarIdx];
    const idx = low.indexOf(keyword);
    const rest = message.slice(idx + keyword.length).replace(/^[\s"'a-z]+/i, '').trim();
    return { type: 'SIMILAR', value: rest || '' };
  }

  // Precio
  const priceMatch = PRICE_REGEX.exec(message);
  if (priceMatch) {
    const amount = parseFloat(priceMatch[1].replace(/[.,]/g, ''));
    const direction = PRICE_LESS.test(low) ? 'less' : PRICE_MORE.test(low) ? 'more' : 'less';
    return { type: 'PRICE', value: amount, direction };
  }

  // Novedades
  if (NEW_WORDS.some(w => low.includes(w))) {
    return { type: 'NEW' };
  }

  // Disponibles
  if (AVAILABLE_WORDS.some(w => low.includes(w))) {
    return { type: 'AVAILABLE' };
  }

  // Género — buscar coincidencia en el mensaje
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    const normGenre = genre.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (low.includes(normGenre) || keywords.some(k => low.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return { type: 'GENRE', value: genre };
    }
  }

  // Búsqueda libre — usar el texto completo como término
  return { type: 'FREE_SEARCH', value: message.trim() };
}

// ── Matcher de libros ──────────────────────────────────────────

/**
 * @param {object} intent
 * @param {{ id, title, author, categories, price, available, rating, isNew }[]} candidateBooks
 * @param {object} userContext
 * @returns {{ bookId, title, author, cover, price, rating, available, reason }[]}
 */
function matchBooks(intent, candidateBooks, userContext) {
  const { purchasedBookIds = [], purchasedAuthors = [], purchasedCategories = [], preferences = [] } = userContext;
  const ownedSet = new Set(purchasedBookIds.map(Number));
  const candidates = candidateBooks.filter(b => !ownedSet.has(b.id));

  let matches = [];

  switch (intent.type) {

    case 'GENRE': {
      const genreNorm = normalize(intent.value);
      matches = candidates
        .filter(b => (b.categories ?? []).some(c => normalize(c).includes(genreNorm) || genreNorm.includes(normalize(c))))
        .map(b => ({ ...b, _reason: `Género: ${intent.value}` }));
      break;
    }

    case 'AUTHOR': {
      const authorNorm = normalize(intent.value);
      matches = candidates
        .filter(b => normalize(b.author).includes(authorNorm) || authorNorm.includes(normalize(b.author.split(' ')[0])))
        .map(b => ({ ...b, _reason: `Autor: ${b.author}` }));
      break;
    }

    case 'SIMILAR': {
      if (!intent.value) { matches = candidates.slice(0, 5).map(b => ({ ...b, _reason: 'Podría gustarte' })); break; }
      const queryNorm = normalize(intent.value);
      // Buscar el libro de referencia
      const ref = candidateBooks.find(b => normalize(b.title).includes(queryNorm));
      if (ref) {
        matches = candidates
          .filter(b => b.id !== ref.id && (b.categories ?? []).some(c => (ref.categories ?? []).includes(c)))
          .map(b => ({ ...b, _reason: `Similar a "${ref.title}"` }));
      } else {
        // Fallback: buscar por término en título
        matches = candidates
          .filter(b => normalize(b.title).includes(queryNorm) || normalize(b.author).includes(queryNorm))
          .map(b => ({ ...b, _reason: `Relacionado con "${intent.value}"` }));
      }
      break;
    }

    case 'PRICE': {
      matches = candidates
        .filter(b => intent.direction === 'less' ? b.price <= intent.value : b.price >= intent.value)
        .sort((a, b) => intent.direction === 'less' ? a.price - b.price : b.price - a.price)
        .map(b => ({ ...b, _reason: `Precio ${intent.direction === 'less' ? 'hasta' : 'desde'} ${fmt(intent.value)}` }));
      break;
    }

    case 'NEW': {
      matches = candidates
        .filter(b => b.isNew)
        .map(b => ({ ...b, _reason: 'Novedad en catálogo' }));
      break;
    }

    case 'AVAILABLE': {
      matches = candidates
        .filter(b => b.available)
        .slice(0, 8)
        .map(b => ({ ...b, _reason: 'Disponible ahora' }));
      break;
    }

    case 'PERSONAL': {
      if (purchasedCategories.length === 0 && preferences.length === 0) {
        // Sin historial: recomendar los mejor valorados
        matches = [...candidates]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 6)
          .map(b => ({ ...b, _reason: 'Mejor valorado' }));
      } else {
        const allPrefs = [...purchasedCategories, ...preferences].map(normalize);
        const authorNorms = purchasedAuthors.map(normalize);
        const scored = candidates.map(b => {
          let score = 0;
          let reason = 'Recomendado para ti';
          const catNorms = (b.categories ?? []).map(normalize);
          const authorNorm = normalize(b.author);

          if (authorNorms.some(a => authorNorm.includes(a) || a.includes(authorNorm.split(' ')[0]))) {
            score += 4; reason = `Porque compraste libros de ${b.author}`;
          }
          const catOverlap = catNorms.filter(c => allPrefs.includes(c));
          if (catOverlap.length > 0) {
            score += catOverlap.length * 2;
            if (score < 4) reason = `Basado en tu interés por ${catOverlap[0]}`;
          }
          return { ...b, _score: score, _reason: reason };
        });
        matches = scored.filter(b => b._score > 0).sort((a, b) => b._score - a._score);
      }
      break;
    }

    case 'FREE_SEARCH': {
      const queryNorm = normalize(intent.value);
      matches = candidates
        .filter(b =>
          normalize(b.title).includes(queryNorm) ||
          normalize(b.author).includes(queryNorm) ||
          (b.categories ?? []).some(c => normalize(c).includes(queryNorm))
        )
        .map(b => ({ ...b, _reason: `Coincide con "${intent.value}"` }));
      break;
    }

    case 'BESTSELLERS':
    case 'TOP_RATED':
    case 'NEW_RELEASES':
    case 'TRENDING': {
      matches = matchTrendingBooks(intent.type, candidates, userContext);
      break;
    }

    default:
      break;
  }

  // Ordenar por rating si no tienen _score propio
  return matches
    .sort((a, b) => (b._score ?? b.rating ?? 0) - (a._score ?? a.rating ?? 0))
    .slice(0, 5)
    .map(b => ({
      bookId:    b.id,
      title:     b.title,
      author:    b.author,
      cover:     b.cover,
      price:     b.price,
      rating:    b.rating,
      available: b.available,
      reason:    b._reason ?? 'Recomendado para ti',
    }));
}

// ── Matcher de tendencias con scoring personalizado ───────────

/**
 * Combina una lista de tendencias globales (IDs ordenados por relevancia)
 * con las preferencias del usuario para generar una lista personalizada.
 *
 * Scoring:
 *   posición en trend  → peso decreciente (top-1 = ×5, top-2 = ×4 … top-5+ = ×1)
 *   overlap categorías → ×2 por coincidencia con purchasedCategories + preferences
 *   autor comprado     → ×3 bonus adicional
 */
function matchTrendingBooks(intentType, candidates, userContext) {
  const {
    purchasedCategories = [], preferences = [], purchasedAuthors = [],
    bestsellerIds = [], topRatedIds = [], newBookIds = [],
  } = userContext;

  const allPrefs    = [...purchasedCategories, ...preferences].map(normalize);
  const authorNorms = purchasedAuthors.map(a => normalize(a.split(' ')[0]));

  // Seleccionar la lista de tendencia según intención
  let trendList;
  let reasonLabel;
  switch (intentType) {
    case 'BESTSELLERS':
      trendList   = bestsellerIds;
      reasonLabel = '📈 Más vendido';
      break;
    case 'TOP_RATED':
      trendList   = topRatedIds;
      reasonLabel = '⭐ Mejor calificado';
      break;
    case 'NEW_RELEASES':
      trendList   = newBookIds;
      reasonLabel = '✨ Novedad reciente';
      break;
    case 'TRENDING':
    default: {
      // Fusionar las tres listas dando peso a cada posición
      const scoreMap = {};
      const addList = (ids, weight) =>
        ids.forEach((id, i) => { scoreMap[id] = (scoreMap[id] ?? 0) + weight / (i + 1); });
      addList(bestsellerIds, 3);
      addList(topRatedIds,   2);
      addList(newBookIds,    1);
      trendList   = Object.entries(scoreMap)
        .sort(([,a],[,b]) => b - a).map(([id]) => Number(id));
      reasonLabel = '🔥 En tendencia';
      break;
    }
  }

  if (trendList.length === 0) return [];

  const trendSet = new Set(trendList.map(Number));

  // Solo candidatos que están en la lista de tendencias
  const inTrend = candidates.filter(b => trendSet.has(b.id));

  // Score final = posición en trend (personalización incluida)
  const POSITION_WEIGHTS = [5, 4, 3, 2, 1.5, 1];

  return inTrend
    .map(b => {
      const trendPos = trendList.indexOf(b.id);
      const posScore = POSITION_WEIGHTS[Math.min(trendPos, POSITION_WEIGHTS.length - 1)] ?? 1;

      const catNorms   = (b.categories ?? []).map(normalize);
      const catOverlap = catNorms.filter(c => allPrefs.includes(c)).length;
      const authorHit  = authorNorms.some(a => normalize(b.author).includes(a));

      const personalBoost = catOverlap * 2 + (authorHit ? 3 : 0);
      const totalScore    = posScore + personalBoost;

      let reason = reasonLabel;
      if (authorHit)        reason += ` · de ${b.author.split(' ').slice(0, 2).join(' ')}`;
      else if (catOverlap)  reason += ` · de tu interés`;

      return { ...b, _score: totalScore, _reason: reason };
    })
    .sort((a, b) => b._score - a._score);
}

// ── Generador de respuesta textual ────────────────────────────

function buildTextResponse(intent, books, userName) {
  const name = userName ? `, ${userName.split(' ')[0]}` : '';

  switch (intent.type) {
    case 'GREETING':
      return `¡Hola${name}! 👋 Soy tu asistente de recomendaciones de Biblión. Puedo ayudarte a encontrar libros por género, autor, precio o similares a uno que ya conoces. ¿Qué tipo de libro buscas hoy?`;

    case 'HELP':
      return `Puedo ayudarte con:\n• **Géneros**: "recomiéndame ciencia ficción"\n• **Autores**: "libros de García Márquez"\n• **Similares**: "algo similar a El Quijote"\n• **Precio**: "libros de menos de 30.000"\n• **Novedades**: "libros nuevos"\n• **Personalizadas**: "qué me recomiendas"\n• **Tendencias**: "más vendidos", "mejor calificados", "novedades recientes"\n\n¿Por dónde empezamos?`;

    case 'TRENDING':
      if (books.length === 0) return `No hay suficientes datos de tendencias aún. ¡Explora el catálogo y realiza compras para que el sistema aprenda!`;
      return `Estos son los libros 🔥 **en tendencia** ahora mismo, filtrados según tus gustos${userName ? `, ${userName.split(' ')[0]}` : ''}:`;

    case 'BESTSELLERS':
      if (books.length === 0) return `Aún no hay datos suficientes de ventas. ¡Sé el primero en comprar y marcar tendencia!`;
      return `Los libros 📈 **más vendidos** que podrían interesarte:`;

    case 'TOP_RATED':
      if (books.length === 0) return `Aún no hay reseñas suficientes para calcular los mejor calificados.`;
      return `Los libros ⭐ **mejor calificados** por la comunidad, priorizados según tus preferencias:`;

    case 'NEW_RELEASES':
      if (books.length === 0) return `No hay novedades recientes en este momento. ¡Vuelve pronto!`;
      return `Las ✨ **novedades más recientes** del catálogo, adaptadas a lo que te gusta:`;

    case 'GENRE':
      if (books.length === 0) return `No encontré libros de "${intent.value}" disponibles en este momento. ¿Quieres que busque en otra categoría?`;
      return `Aquí tienes ${books.length} libro${books.length > 1 ? 's' : ''} de **${intent.value}** que podrían gustarte:`;

    case 'AUTHOR':
      if (books.length === 0) return `No encontré libros de "${intent.value}" en el catálogo. ¿Quieres buscar otro autor?`;
      return `Encontré ${books.length} libro${books.length > 1 ? 's' : ''} de **${intent.value}**:`;

    case 'SIMILAR':
      if (books.length === 0) return `No encontré libros similares en este momento. Prueba buscando por género o autor.`;
      return `Basándome en lo que describes, estos títulos podrían interesarte:`;

    case 'PRICE':
      if (books.length === 0) return `No encontré libros en ese rango de precio ahora mismo.`;
      return `Aquí tienes opciones ${intent.direction === 'less' ? `por debajo de ${fmt(intent.value)}` : `por encima de ${fmt(intent.value)}`}:`;

    case 'NEW':
      if (books.length === 0) return `No hay novedades disponibles en este momento. ¡Revisa pronto el catálogo!`;
      return `Estas son las novedades más recientes del catálogo:`;

    case 'AVAILABLE':
      if (books.length === 0) return `No hay libros con stock disponible en este momento.`;
      return `Libros disponibles para compra inmediata:`;

    case 'PERSONAL':
      if (books.length === 0) return `Realiza tu primera compra o configura tus preferencias en el perfil para recibir recomendaciones personalizadas.`;
      return `Basándome en tu historial${name}, aquí tienes mis recomendaciones para ti:`;

    case 'FREE_SEARCH':
      if (books.length === 0) return `No encontré resultados para "${intent.value}". Intenta con el nombre de un género, autor o describe el tipo de libro que buscas.`;
      return `Esto es lo que encontré para "${intent.value}":`;

    default:
      return `No estoy seguro de lo que buscas. Puedes pedirme: "recomiéndame libros de aventura", "libros de Borges" o "qué me recomiendas".`;
  }
}

// ── API principal ──────────────────────────────────────────────

/**
 * Procesa un mensaje del usuario y devuelve la respuesta del bot.
 */
function processMessage(message, candidateBooks, userContext) {
  const intent = extractIntent(message);
  let books = [];

  const noMatch = ['GREETING', 'HELP', 'UNKNOWN'];
  if (!noMatch.includes(intent.type)) {
    books = matchBooks(intent, candidateBooks, userContext);
  }

  const text = buildTextResponse(intent, books, userContext.userName);

  return { text, books: books.length > 0 ? books : undefined, intent: intent.type };
}

// ── Utils ──────────────────────────────────────────────────────

function normalize(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

module.exports = { processMessage };
