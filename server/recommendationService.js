/**
 * RecommendationService
 *
 * Recibe señales pre-agregadas desde el cliente y puntúa el catálogo
 * candidato usando un sistema de Score Accumulation ponderado:
 *
 *   autor comprado      → ×4
 *   categoría comprada  → ×3 (por coincidencia)
 *   categoría calificada ≥4★ → ×2
 *   preferencias perfil → ×1.5
 *   término de búsqueda → ×1
 */

const WEIGHTS = {
  author:   4,
  purchase: 3,
  rating:   2,
  prefs:    1.5,
  search:   1,
};

/**
 * @param {object} params
 * @param {number[]}  params.purchasedBookIds   - IDs ya poseídos (excluir)
 * @param {string[]}  params.purchasedAuthors   - Autores de compras previas
 * @param {string[]}  params.purchasedCategories- Categorías de compras previas (puede repetirse)
 * @param {string[]}  params.highRatedCategories- Categorías de reseñas con rating ≥4
 * @param {string[]}  params.preferences        - temasPreferencia del perfil
 * @param {string[]}  params.searchTerms        - Historial de búsquedas recientes
 * @param {{ id: number, title: string, author: string, categories: string[] }[]} params.candidateBooks
 * @returns {{ bookId: number, score: number, reason: string }[]}
 */
function computeRecommendations({
  purchasedBookIds = [],
  purchasedAuthors = [],
  purchasedCategories = [],
  highRatedCategories = [],
  preferences = [],
  searchTerms = [],
  candidateBooks = [],
}) {
  // Normalizar para comparaciones case-insensitive
  const ownedSet       = new Set(purchasedBookIds.map(Number));
  const authorsSet     = new Set(purchasedAuthors.map(s => s.toLowerCase().trim()));
  const searchLower    = searchTerms.map(s => s.toLowerCase().trim()).filter(Boolean);

  // Frecuencias de categorías para señales de compra y calificación
  const purchaseCatFreq  = buildFreqMap(purchasedCategories);
  const ratingCatFreq    = buildFreqMap(highRatedCategories);
  const prefSet          = new Set(preferences.map(s => s.toLowerCase().trim()));

  const results = [];

  for (const book of candidateBooks) {
    // Ignorar libros sin ID o sin stock
    if (book.id == null) continue;
    if (ownedSet.has(book.id)) continue;

    const signals = [];
    // Null-safety: algunos libros pueden llegar con campos faltantes
    const bookAuthorLow  = (book.author ?? '').toLowerCase().trim();
    // Acepta tanto `categories` (array) como `category` (string singular)
    const rawCats        = book.categories ?? (book.category ? [book.category] : []);
    const bookCatsLower  = Array.isArray(rawCats)
      ? rawCats.map(c => String(c).toLowerCase().trim())
      : [];
    const bookTitleLow   = (book.title ?? '').toLowerCase();

    // ── Señal: autor comprado previamente ──
    if (authorsSet.has(bookAuthorLow)) {
      signals.push({
        type: 'author',
        points: WEIGHTS.author,
        value: book.author,
      });
    }

    // ── Señal: categorías de compras (suma de frecuencias) ──
    let purchaseCatScore = 0;
    let topPurchaseCat   = '';
    for (const cat of bookCatsLower) {
      const freq = purchaseCatFreq[cat] ?? 0;
      if (freq > 0) {
        purchaseCatScore += freq * WEIGHTS.purchase;
        if (!topPurchaseCat || (purchaseCatFreq[cat] > (purchaseCatFreq[topPurchaseCat] ?? 0)))
          topPurchaseCat = cat;
      }
    }
    if (purchaseCatScore > 0) {
      signals.push({
        type: 'purchase',
        points: purchaseCatScore,
        value: capitalize(topPurchaseCat),
      });
    }

    // ── Señal: categorías con calificaciones altas ──
    let ratingCatScore = 0;
    let topRatingCat   = '';
    for (const cat of bookCatsLower) {
      const freq = ratingCatFreq[cat] ?? 0;
      if (freq > 0) {
        ratingCatScore += freq * WEIGHTS.rating;
        if (!topRatingCat || (ratingCatFreq[cat] > (ratingCatFreq[topRatingCat] ?? 0)))
          topRatingCat = cat;
      }
    }
    if (ratingCatScore > 0) {
      signals.push({
        type: 'rating',
        points: ratingCatScore,
        value: capitalize(topRatingCat),
      });
    }

    // ── Señal: preferencias del perfil ──
    let prefScore    = 0;
    let topPrefCat   = '';
    for (const cat of bookCatsLower) {
      if (prefSet.has(cat)) {
        prefScore += WEIGHTS.prefs;
        if (!topPrefCat) topPrefCat = cat;
      }
    }
    if (prefScore > 0) {
      signals.push({
        type: 'prefs',
        points: prefScore,
        value: capitalize(topPrefCat),
      });
    }

    // ── Señal: términos de búsqueda recientes ──
    let searchScore   = 0;
    let matchedSearch = '';
    for (const term of searchLower) {
      if (
        bookTitleLow.includes(term) ||
        bookAuthorLow.includes(term) ||
        bookCatsLower.some(c => c.includes(term))
      ) {
        searchScore += WEIGHTS.search;
        if (!matchedSearch) matchedSearch = term;
      }
    }
    if (searchScore > 0) {
      signals.push({
        type: 'search',
        points: searchScore,
        value: matchedSearch,
      });
    }

    if (signals.length === 0) continue; // ninguna señal → no recomendar

    const totalScore = signals.reduce((s, sig) => s + sig.points, 0);
    const winnerSignal = signals.reduce((a, b) => (a.points >= b.points ? a : b));

    results.push({
      bookId: book.id,
      score: Math.round(totalScore * 10) / 10,
      reason: buildReason(winnerSignal),
    });
  }

  // Ordenar: mayor score primero; en empate, menor bookId (más relevante del catálogo)
  results.sort((a, b) => b.score - a.score || a.bookId - b.bookId);

  return results.slice(0, 12); // máximo 12 recomendaciones
}

// ── Helpers ───────────────────────────────────────────────────

function buildFreqMap(arr) {
  const map = {};
  for (const item of arr) {
    const key = item.toLowerCase().trim();
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildReason(signal) {
  switch (signal.type) {
    case 'author':   return `Porque compraste otros libros de ${signal.value}`;
    case 'purchase': return `Basado en tu interés por ${signal.value}`;
    case 'rating':   return `Porque calificaste alto libros de ${signal.value}`;
    case 'prefs':    return `Basado en tu preferencia por ${signal.value}`;
    case 'search':   return `Relacionado con tu búsqueda "${signal.value}"`;
    default:         return 'Recomendado para ti';
  }
}

module.exports = { computeRecommendations };
