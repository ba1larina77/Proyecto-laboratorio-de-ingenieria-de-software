import { useState } from "react";
import { BookOpen, User, Mail, Lock, Calendar, MapPin, Home, FileText, Tag } from "lucide-react";
import { Link } from "react-router";

export function Register() {
  const [formData, setFormData] = useState({
    dni: "",
    nombres: "",
    apellidos: "",
    fechaNacimiento: "",
    lugarNacimiento: "",
    direccion: "",
    genero: "",
    correo: "",
    temasPreferencia: [] as string[],
    usuario: "",
    contrasena: "",
    confirmarContrasena: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, temasPreferencia: selected }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.contrasena !== formData.confirmarContrasena) {
      alert("Las contraseñas no coinciden");
      return;
    }
    console.log("Register attempt with:", formData);
    // Add your registration logic here
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ backgroundColor: '#FEFAE0' }}>
      <div className="w-full max-w-4xl">
        <div className="rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#4A3728' }}>
              <BookOpen className="w-10 h-10" style={{ color: '#D4A373' }} />
            </div>
            <h1 className="mb-2" style={{ color: '#4A3728' }}>Registro de Nuevo Usuario</h1>
            <p className="text-sm" style={{ color: '#4A3728', opacity: 0.7 }}>
              Completa tus datos para unirte a nuestra biblioteca
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <div>
              <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DNI */}
                <div className="space-y-2">
                  <label htmlFor="dni" className="block" style={{ color: '#4A3728' }}>
                    DNI *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="dni"
                      name="dni"
                      type="text"
                      value={formData.dni}
                      onChange={handleChange}
                      placeholder="12345678"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Nombres */}
                <div className="space-y-2">
                  <label htmlFor="nombres" className="block" style={{ color: '#4A3728' }}>
                    Nombres *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="nombres"
                      name="nombres"
                      type="text"
                      value={formData.nombres}
                      onChange={handleChange}
                      placeholder="Juan Carlos"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Apellidos */}
                <div className="space-y-2">
                  <label htmlFor="apellidos" className="block" style={{ color: '#4A3728' }}>
                    Apellidos *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="apellidos"
                      name="apellidos"
                      type="text"
                      value={formData.apellidos}
                      onChange={handleChange}
                      placeholder="Pérez García"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Fecha de Nacimiento */}
                <div className="space-y-2">
                  <label htmlFor="fechaNacimiento" className="block" style={{ color: '#4A3728' }}>
                    Fecha de Nacimiento *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Lugar de Nacimiento */}
                <div className="space-y-2">
                  <label htmlFor="lugarNacimiento" className="block" style={{ color: '#4A3728' }}>
                    Lugar de Nacimiento *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="lugarNacimiento"
                      name="lugarNacimiento"
                      type="text"
                      value={formData.lugarNacimiento}
                      onChange={handleChange}
                      placeholder="Lima, Perú"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Género */}
                <div className="space-y-2">
                  <label htmlFor="genero" className="block" style={{ color: '#4A3728' }}>
                    Género *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: '#D4A373' }} />
                    <select
                      id="genero"
                      name="genero"
                      value={formData.genero}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all appearance-none"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    >
                      <option value="">Seleccionar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                      <option value="prefiero-no-decir">Prefiero no decir</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dirección - Full Width */}
              <div className="space-y-2 mt-4">
                <label htmlFor="direccion" className="block" style={{ color: '#4A3728' }}>
                  Dirección *
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Av. Principal 123, Distrito, Ciudad"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                    style={{ 
                      backgroundColor: '#FEFAE0',
                      borderColor: '#D4A373',
                      color: '#4A3728'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Información de Cuenta */}
            <div>
              <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                Información de Cuenta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Correo */}
                <div className="space-y-2">
                  <label htmlFor="correo" className="block" style={{ color: '#4A3728' }}>
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="correo"
                      name="correo"
                      type="email"
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Usuario */}
                <div className="space-y-2">
                  <label htmlFor="usuario" className="block" style={{ color: '#4A3728' }}>
                    Usuario *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="usuario"
                      name="usuario"
                      type="text"
                      value={formData.usuario}
                      onChange={handleChange}
                      placeholder="nombreusuario"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <label htmlFor="contrasena" className="block" style={{ color: '#4A3728' }}>
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="contrasena"
                      name="contrasena"
                      type="password"
                      value={formData.contrasena}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-2">
                  <label htmlFor="confirmarContrasena" className="block" style={{ color: '#4A3728' }}>
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                    <input
                      id="confirmarContrasena"
                      name="confirmarContrasena"
                      type="password"
                      value={formData.confirmarContrasena}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferencias */}
            <div>
              <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                Preferencias de Lectura
              </h3>
              <div className="space-y-2">
                <label htmlFor="temasPreferencia" className="block" style={{ color: '#4A3728' }}>
                  Temas de Preferencia * (Mantén presionado Ctrl/Cmd para seleccionar múltiples)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 w-5 h-5 z-10" style={{ color: '#D4A373' }} />
                  <select
                    id="temasPreferencia"
                    name="temasPreferencia"
                    value={formData.temasPreferencia}
                    onChange={handleTemasChange}
                    required
                    multiple
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all min-h-32"
                    style={{ 
                      backgroundColor: '#FEFAE0',
                      borderColor: '#D4A373',
                      color: '#4A3728'
                    }}
                  >
                    <option value="ficcion">Ficción</option>
                    <option value="no-ficcion">No Ficción</option>
                    <option value="ciencia">Ciencia</option>
                    <option value="historia">Historia</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="arte">Arte</option>
                    <option value="filosofia">Filosofía</option>
                    <option value="poesia">Poesía</option>
                    <option value="biografia">Biografía</option>
                    <option value="infantil">Infantil</option>
                    <option value="juvenil">Juvenil</option>
                    <option value="novela-grafica">Novela Gráfica</option>
                  </select>
                </div>
                <p className="text-xs" style={{ color: '#4A3728', opacity: 0.6 }}>
                  Seleccionados: {formData.temasPreferencia.length > 0 ? formData.temasPreferencia.join(", ") : "Ninguno"}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg"
                style={{ 
                  backgroundColor: '#606C38',
                  color: '#FEFAE0'
                }}
              >
                Crear Cuenta
              </button>
              <Link to="/" className="flex-1">
                <button
                  type="button"
                  className="w-full py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md"
                  style={{ 
                    borderColor: '#D4A373',
                    color: '#4A3728',
                    backgroundColor: 'transparent'
                  }}
                >
                  Ya tengo cuenta
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
