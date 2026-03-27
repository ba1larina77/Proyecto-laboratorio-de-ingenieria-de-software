import { useState } from "react";
import { Search, User, BookOpen, Sparkles, Clock, Filter, X, ChevronDown, ShoppingCart } from "lucide-react";
import { Link } from "react-router";

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  cover: string;
  rating: number;
  isNew?: boolean;
}

export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filters, setFilters] = useState({
    category: "todas",
    condition: "todos",
    rating: "todas",
    availability: "todos"
  });

  // Mock data - Libros recién añadidos
  const newBooks: Book[] = [
    {
      id: 1,
      title: "Cien Años de Soledad",
      author: "Gabriel García Márquez",
      category: "Ficción",
      cover: "https://images.unsplash.com/photo-1763571084092-a4306456166b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwYm9vayUyMGNvdmVyJTIwbGl0ZXJhdHVyZXxlbnwxfHx8fDE3NzI3MDAyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.8,
      isNew: true
    },
    {
      id: 2,
      title: "El Principito",
      author: "Antoine de Saint-Exupéry",
      category: "Ficción",
      cover: "https://images.unsplash.com/photo-1763768861268-cb6b54173dbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwbm92ZWwlMjBib29rJTIwY292ZXJ8ZW58MXx8fHwxNzcyNzIyMjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.9,
      isNew: true
    },
    {
      id: 3,
      title: "Breve Historia del Tiempo",
      author: "Stephen Hawking",
      category: "Ciencia",
      cover: "https://images.unsplash.com/photo-1725870475677-7dc91efe9f93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbmNlJTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc3MjgwNTQ5NXww&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.7,
      isNew: true
    },
    {
      id: 4,
      title: "Sapiens",
      author: "Yuval Noah Harari",
      category: "Historia",
      cover: "https://images.unsplash.com/photo-1764509422504-f9aee0a1dd76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3J5JTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc3Mjc0NjUyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.6,
      isNew: true
    },
  ];

  // Mock data - Recomendaciones personalizadas
  const recommendedBooks: Book[] = [
    {
      id: 5,
      title: "Veinte Poemas de Amor",
      author: "Pablo Neruda",
      category: "Poesía",
      cover: "https://images.unsplash.com/photo-1762554907633-e2f14e742413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2V0cnklMjBib29rJTIwcGFnZXN8ZW58MXx8fHwxNzcyODAyNTU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.9
    },
    {
      id: 6,
      title: "1984",
      author: "George Orwell",
      category: "Ficción",
      cover: "https://images.unsplash.com/photo-1769964108693-f43583342838?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaWN0aW9uJTIwbm92ZWwlMjBjb3ZlcnxlbnwxfHx8fDE3NzI2OTk0MDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.8
    },
    {
      id: 7,
      title: "El Mundo de Sofía",
      author: "Jostein Gaarder",
      category: "Filosofía",
      cover: "https://images.unsplash.com/photo-1769729829047-7005ae8a5c8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGlsb3NvcGh5JTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc3MjgwOTY2OHww&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.7
    },
    {
      id: 8,
      title: "Historia del Arte",
      author: "Ernst Gombrich",
      category: "Arte",
      cover: "https://images.unsplash.com/photo-1695987622803-9a9fb7b15e99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBib29rJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzcyODA5NjY2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      rating: 4.6
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Buscando:", searchQuery, "con filtros:", filters);
    // Implementar lógica de búsqueda
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "todas",
      condition: "todos",
      rating: "todas",
      availability: "todos"
    });
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value, index) => {
      const defaultValues = ["todas", "todos", "todas", "todos"];
      return value !== defaultValues[index];
    }
  ).length;

  const BookCard = ({ book }: { book: Book }) => (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-lg shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
        <img 
          src={book.cover} 
          alt={book.title}
          className="w-full h-64 sm:h-72 object-cover"
        />
        {book.isNew && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{ backgroundColor: '#606C38', color: '#FEFAE0' }}>
            <Sparkles className="w-3 h-3" />
            Nuevo
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 p-4 text-white">
            <p className="text-sm opacity-90">Calificación: ⭐ {book.rating}/5.0</p>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-medium line-clamp-1" style={{ color: '#4A3728' }}>{book.title}</h3>
        <p className="text-sm" style={{ color: '#4A3728', opacity: 0.7 }}>{book.author}</p>
        <span className="inline-block text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#D4A373', color: '#4A3728' }}>
          {book.category}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFAE0' }}>
      {/* Header / Barra Superior */}
      <header className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4A3728' }}>
                <BookOpen className="w-5 h-5" style={{ color: '#D4A373' }} />
              </div>
              <h2 className="hidden sm:block font-medium whitespace-nowrap" style={{ color: '#4A3728' }}>Biblioteca Digital</h2>
            </div>

            {/* Barra de Búsqueda */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Buscar libros, autores, categorías..."
                  className="w-full pl-12 pr-4 py-2.5 rounded-lg border-2 focus:outline-none transition-all"
                  style={{ 
                    backgroundColor: '#FEFAE0',
                    borderColor: '#D4A373',
                    color: '#4A3728'
                  }}
                />
              </div>

              {/* Botón de Filtros - Solo visible cuando la búsqueda está enfocada */}
              {searchFocused && (
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-shrink-0 p-2.5 rounded-lg hover:bg-opacity-10 transition-all relative"
                  style={{ backgroundColor: showFilters ? '#D4A373' : '#FEFAE0', border: '2px solid #D4A373' }}
                >
                  <Filter className="w-5 h-5" style={{ color: '#4A3728' }} />
                  {activeFiltersCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
                      style={{ backgroundColor: '#606C38', color: '#FEFAE0' }}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              )}

              {/* Panel de Filtros */}
              {showFilters && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-lg shadow-xl z-50 max-w-2xl mx-auto" style={{ backgroundColor: '#FFFFFF', border: '2px solid #D4A373' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium" style={{ color: '#4A3728' }}>Filtros de Búsqueda</h3>
                    <div className="flex items-center gap-2">
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-xs hover:underline"
                          style={{ color: '#606C38' }}
                        >
                          Limpiar filtros
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="p-1 rounded-md hover:bg-opacity-10 transition-all"
                        style={{ backgroundColor: '#4A3728' }}
                      >
                        <X className="w-4 h-4" style={{ color: '#4A3728' }} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Categoría */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: '#4A3728' }}>
                        Categoría
                      </label>
                      <div className="relative">
                        <select
                          value={filters.category}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none appearance-none cursor-pointer"
                          style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                        >
                          <option value="todas">Todas las categorías</option>
                          <option value="ficcion">Ficción</option>
                          <option value="no-ficcion">No Ficción</option>
                          <option value="ciencia">Ciencia</option>
                          <option value="historia">Historia</option>
                          <option value="tecnologia">Tecnología</option>
                          <option value="arte">Arte</option>
                          <option value="filosofia">Filosofía</option>
                          <option value="poesia">Poesía</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#4A3728' }} />
                      </div>
                    </div>

                    {/* Estado (Nuevo/Usado) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: '#4A3728' }}>
                        Estado del Libro
                      </label>
                      <div className="relative">
                        <select
                          value={filters.condition}
                          onChange={(e) => handleFilterChange('condition', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none appearance-none cursor-pointer"
                          style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                        >
                          <option value="todos">Todos los estados</option>
                          <option value="nuevo">Nuevo</option>
                          <option value="usado-excelente">Usado - Excelente</option>
                          <option value="usado-bueno">Usado - Bueno</option>
                          <option value="usado-aceptable">Usado - Aceptable</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#4A3728' }} />
                      </div>
                    </div>

                    {/* Calificación */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: '#4A3728' }}>
                        Calificación Mínima
                      </label>
                      <div className="relative">
                        <select
                          value={filters.rating}
                          onChange={(e) => handleFilterChange('rating', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none appearance-none cursor-pointer"
                          style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                        >
                          <option value="todas">Todas las calificaciones</option>
                          <option value="4.5">⭐ 4.5+</option>
                          <option value="4.0">⭐ 4.0+</option>
                          <option value="3.5">⭐ 3.5+</option>
                          <option value="3.0">⭐ 3.0+</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#4A3728' }} />
                      </div>
                    </div>

                    {/* Disponibilidad */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: '#4A3728' }}>
                        Disponibilidad
                      </label>
                      <div className="relative">
                        <select
                          value={filters.availability}
                          onChange={(e) => handleFilterChange('availability', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none appearance-none cursor-pointer"
                          style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                        >
                          <option value="todos">Todos</option>
                          <option value="disponible">Disponible ahora</option>
                          <option value="reservado">Reservado</option>
                          <option value="prestado">Prestado</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#4A3728' }} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    onClick={() => setShowFilters(false)}
                    className="w-full mt-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                    style={{ backgroundColor: '#606C38', color: '#FEFAE0' }}
                  >
                    Aplicar Filtros
                  </button>
                </div>
              )}
            </form>

            {/* Perfil de Usuario */}
            <Link to="/profile" className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:opacity-80" style={{ backgroundColor: '#606C38' }}>
                <User className="w-5 h-5" style={{ color: '#FEFAE0' }} />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Bienvenida */}
        <div className="mb-8 p-6 rounded-2xl shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6" style={{ color: '#606C38' }} />
            <h1 style={{ color: '#4A3728' }}>¡Bienvenido de vuelta!</h1>
          </div>
          <p className="text-sm" style={{ color: '#4A3728', opacity: 0.7 }}>
            Descubre nuevas lecturas y continúa explorando tu colección personalizada
          </p>
          <Link to="/shop">
            <button
              className="mt-4 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all hover:opacity-90"
              style={{ backgroundColor: '#606C38', color: '#FEFAE0', fontSize: '14px' }}
            >
              <ShoppingCart className="w-4 h-4" />
              Ir a la tienda
            </button>
          </Link>
        </div>

        {/* Sección: Recién Añadidos */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6" style={{ color: '#606C38' }} />
            <h2 style={{ color: '#4A3728' }}>Recién Añadidos al Catálogo</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>

        {/* Sección: Recomendaciones Personalizadas */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6" style={{ color: '#606C38' }} />
            <h2 style={{ color: '#4A3728' }}>Recomendaciones Para Ti</h2>
          </div>
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D4A373' }}>
            <p className="text-sm" style={{ color: '#4A3728' }}>
              📚 Basado en tus intereses: <span className="font-medium">Ficción, Ciencia, Historia, Poesía</span>
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {recommendedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}