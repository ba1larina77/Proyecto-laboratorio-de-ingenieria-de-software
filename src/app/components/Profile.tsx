import { useState, useEffect } from "react";
import { BookOpen, User, Mail, Lock, Calendar, MapPin, Home, FileText, ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useShop } from "../store/ShopContext";
import { Toast } from "./shop/Toast";

function validateDate(v: string) {
  if (!v) return "La fecha de nacimiento es obligatoria";
  const date = new Date(v);
  const today = new Date();
  if (isNaN(date.getTime())) return "Fecha inválida";
  if (date > today) return "La fecha no puede ser futura";
  const age = today.getFullYear() - date.getFullYear() -
    (today < new Date(today.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
  if (age < 13) return "Debes tener al menos 13 años para registrarte";
  if (age > 120) return "Fecha de nacimiento inválida";
  return "";
}

function validatePassword(v: string) {
  if (!v) return "La contraseña es obligatoria";
  if (/\s/.test(v)) return "La contraseña no puede contener espacios en blanco";
  if (v.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(v)) return "Debe incluir al menos una letra mayúscula";
  if (!/[0-9]/.test(v)) return "Debe incluir al menos un número";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v))
    return "Debe incluir al menos un carácter especial (!@#$%...)";
  return "";
}

export function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, showToast } = useShop();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dni: user?.dni || "",
    nombres: user?.nombres || "",
    apellidos: user?.apellidos || "",
    fechaNacimiento: user?.fechaNacimiento || "",
    lugarNacimiento: user?.lugarNacimiento || "",
    direccion: user?.direccion || "",
    genero: user?.genero || "",
    correo: user?.email || "",
    usuario: user?.username || "",
    temasPreferencia: user?.temasPreferencia || [],
  });

  const initialDate = user?.fechaNacimiento || "";
  const [bDay, setBDay] = useState(initialDate ? initialDate.split("-")[2] : "");
  const [bMonth, setBMonth] = useState(initialDate ? parseInt(initialDate.split("-")[1], 10).toString() : "");
  const [bYear, setBYear] = useState(initialDate ? initialDate.split("-")[0] : "");

  useEffect(() => {
    if (bDay && bMonth && bYear) {
      const dateStr = `${bYear}-${bMonth.padStart(2, "0")}-${bDay.padStart(2, "0")}`;
      setFormData(prev => ({ ...prev, fechaNacimiento: dateStr }));
    } else {
      setFormData(prev => ({ ...prev, fechaNacimiento: "" }));
    }
  }, [bDay, bMonth, bYear]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function toggleTema(tema: string) {
    setFormData(prev => {
      const selected = prev.temasPreferencia.includes(tema)
        ? prev.temasPreferencia.filter(t => t !== tema)
        : [...prev.temasPreferencia, tema];
      return { ...prev, temasPreferencia: selected };
    });
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateError = validateDate(formData.fechaNacimiento);
    if (dateError) {
      showToast(dateError, "error");
      return;
    }
    updateProfile({
      dni: formData.dni,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      name: `${formData.nombres} ${formData.apellidos}`,
      fechaNacimiento: formData.fechaNacimiento,
      lugarNacimiento: formData.lugarNacimiento,
      direccion: formData.direccion,
      genero: formData.genero,
      username: formData.usuario,
      email: formData.correo,
      temasPreferencia: formData.temasPreferencia
    });
    setIsEditing(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const passError = validatePassword(passwordData.newPassword);
    if (passError) {
      showToast(passError, "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }
    updateProfile({ password: passwordData.newPassword });
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordSection(false);
    showToast("Contraseña actualizada exitosamente", "success");
  };

  const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
      <p className="text-sm font-medium" style={{ color: '#4A3728', opacity: 0.7 }}>{label}</p>
      <p className="font-medium" style={{ color: '#4A3728' }}>{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFAE0' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <button className="p-2 rounded-lg hover:bg-opacity-10 transition-all" style={{ backgroundColor: '#4A3728', color: '#4A3728' }}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <h2 style={{ color: '#4A3728' }}>Mi Perfil</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#606C38' }}>
                <User className="w-5 h-5" style={{ color: '#FEFAE0' }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Header del Perfil */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b" style={{ borderColor: '#D4A373' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4A3728' }}>
              <User className="w-12 h-12" style={{ color: '#D4A373' }} />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="mb-1" style={{ color: '#4A3728' }}>{formData.nombres} {formData.apellidos}</h1>
              <p className="text-sm mb-2" style={{ color: '#4A3728', opacity: 0.7 }}>@{formData.usuario}</p>
              <p className="text-sm" style={{ color: '#4A3728', opacity: 0.6 }}>{formData.correo}</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#606C38', color: '#FEFAE0' }}
              >
                Editar Perfil
              </button>
            )}
          </div>

          {/* Vista de Solo Lectura */}
          {!isEditing && (
            <div className="space-y-8">
              {/* Información Personal */}
              <div>
                <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoField label="DNI" value={formData.dni} />
                  <InfoField label="Nombres" value={formData.nombres} />
                  <InfoField label="Apellidos" value={formData.apellidos} />
                  <InfoField label="Fecha de Nacimiento" value={formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : ""} />
                  <InfoField label="Lugar de Nacimiento" value={formData.lugarNacimiento} />
                  <InfoField label="Género" value={formData.genero ? formData.genero.charAt(0).toUpperCase() + formData.genero.slice(1) : ""} />
                  <div className="sm:col-span-2">
                    <InfoField label="Dirección" value={formData.direccion} />
                  </div>
                </div>
              </div>

              {/* Información de Cuenta */}
              <div>
                <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                  Información de Cuenta
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoField label="Usuario" value={formData.usuario} />
                  <InfoField label="Correo Electrónico" value={formData.correo} />
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="text-sm hover:underline"
                    style={{ color: '#606C38' }}
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </div>

              {/* Preferencias */}
              {user?.role === 'cliente' && (
              <div>
                <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                  Preferencias de Lectura
                </h3>
                <div className="flex flex-wrap gap-2">
                  {formData.temasPreferencia.map((tema) => (
                    <span
                      key={tema}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: '#D4A373', color: '#4A3728' }}
                    >
                      {tema.charAt(0).toUpperCase() + tema.slice(1).replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              )}

              {/* Sección de Cambio de Contraseña */}
              {showPasswordSection && (
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#FEFAE0', border: '2px solid #D4A373' }}>
                  <h3 className="mb-4" style={{ color: '#4A3728' }}>Cambiar Contraseña</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="block text-sm" style={{ color: '#4A3728' }}>
                        Contraseña Actual
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#D4A373', color: '#4A3728' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block text-sm" style={{ color: '#4A3728' }}>
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#D4A373', color: '#4A3728' }}
                        />
                      </div>
                      <div className="text-xs space-y-1 mt-2 mx-1" style={{ color: '#4A3728', opacity: 0.8 }}>
                        <p className={passwordData.newPassword.length >= 8 ? "text-emerald-600 font-bold" : ""}>
                          ✓ Mínimo 8 caracteres
                        </p>
                        <p className={/[A-Z]/.test(passwordData.newPassword) ? "text-emerald-600 font-bold" : ""}>
                          ✓ Al menos una letra mayúscula
                        </p>
                        <p className={/[0-9]/.test(passwordData.newPassword) ? "text-emerald-600 font-bold" : ""}>
                          ✓ Al menos un número
                        </p>
                        <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword) ? "text-emerald-600 font-bold" : ""}>
                          ✓ Al menos un carácter especial
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm" style={{ color: '#4A3728' }}>
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#D4A373', color: '#4A3728' }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                        style={{ backgroundColor: '#606C38', color: '#FEFAE0' }}
                      >
                        Guardar Contraseña
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordSection(false)}
                        className="flex-1 py-2 rounded-lg font-medium border-2 transition-all"
                        style={{ borderColor: '#D4A373', color: '#4A3728', backgroundColor: 'transparent' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Formulario de Edición */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="dni" className="block text-sm" style={{ color: '#4A3728' }}>DNI</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                      <input
                        id="dni"
                        name="dni"
                        type="text"
                        value={formData.dni}
                        disabled
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none opacity-60 cursor-not-allowed"
                        style={{ backgroundColor: '#F5EDD3', borderColor: '#D4A373', color: '#4A3728' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="nombres" className="block text-sm" style={{ color: '#4A3728' }}>Nombres</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                      <input
                        id="nombres"
                        name="nombres"
                        type="text"
                        value={formData.nombres}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                        style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="apellidos" className="block text-sm" style={{ color: '#4A3728' }}>Apellidos</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                      <input
                        id="apellidos"
                        name="apellidos"
                        type="text"
                        value={formData.apellidos}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                        style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="fechaNacimiento" className="block text-sm" style={{ color: '#4A3728' }}>Fecha de Nacimiento</label>
                    <div className="flex gap-2">
                      <select value={bDay} onChange={e => setBDay(e.target.value)}
                        className="flex-1 pl-3 pr-8 py-3 rounded-lg border-2 focus:outline-none appearance-none text-sm"
                        style={{ backgroundColor: "#FEFAE0", borderColor: "#D4A373", color: "#4A3728" }}>
                        <option value="">Día</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d.toString()}>{d}</option>
                        ))}
                      </select>
                      
                      <select value={bMonth} onChange={e => setBMonth(e.target.value)}
                        className="flex-1 pl-3 pr-8 py-3 rounded-lg border-2 focus:outline-none appearance-none text-sm"
                        style={{ backgroundColor: "#FEFAE0", borderColor: "#D4A373", color: "#4A3728" }}>
                        <option value="">Mes</option>
                        {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                          <option key={i + 1} value={(i + 1).toString()}>{m}</option>
                        ))}
                      </select>

                      <select value={bYear} onChange={e => setBYear(e.target.value)}
                        className="flex-1 pl-3 pr-8 py-3 rounded-lg border-2 focus:outline-none appearance-none text-sm"
                        style={{ backgroundColor: "#FEFAE0", borderColor: "#D4A373", color: "#4A3728" }}>
                        <option value="">Año</option>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 13 - i).map(y => (
                          <option key={y} value={y.toString()}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lugarNacimiento" className="block text-sm" style={{ color: '#4A3728' }}>Lugar de Nacimiento</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                      <input
                        id="lugarNacimiento"
                        name="lugarNacimiento"
                        type="text"
                        value={formData.lugarNacimiento}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                        style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="genero" className="block text-sm" style={{ color: '#4A3728' }}>Género</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: '#D4A373' }} />
                      <select
                        id="genero"
                        name="genero"
                        value={formData.genero}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none appearance-none"
                        style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                      >
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                        <option value="prefiero-no-decir">Prefiero no decir</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor="direccion" className="block text-sm" style={{ color: '#4A3728' }}>Dirección</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                      <input
                        id="direccion"
                        name="direccion"
                        type="text"
                        value={formData.direccion}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                        style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Cuenta */}
              <div>
                <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                  Información de Cuenta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="correo" className="block text-sm" style={{ color: '#4A3728' }}>Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                      <input
                        id="correo"
                        name="correo"
                        type="email"
                        value={formData.correo}
                        disabled
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none opacity-60 cursor-not-allowed"
                        style={{ backgroundColor: '#F5EDD3', borderColor: '#D4A373', color: '#4A3728' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="usuario" className="block text-sm" style={{ color: '#4A3728' }}>Usuario</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                      <input
                        id="usuario"
                        name="usuario"
                        type="text"
                        value={formData.usuario}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none"
                        style={{ backgroundColor: '#FEFAE0', borderColor: '#D4A373', color: '#4A3728' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferencias */}
              {user?.role === 'cliente' && (
              <div>
                <h3 className="mb-4 pb-2 border-b" style={{ color: '#4A3728', borderColor: '#D4A373' }}>
                  Preferencias de Lectura
                </h3>
                <div className="space-y-2">
                  <label htmlFor="temasPreferencia" className="block text-sm" style={{ color: '#4A3728' }}>
                    Temas de Preferencia
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Ficción","No Ficción","Ciencia","Historia","Tecnología",
                      "Arte","Filosofía","Poesía","Biografía","Infantil","Juvenil","Novela Gráfica"
                    ].map(t => {
                      const val = t.toLowerCase();
                      const isSelected = formData.temasPreferencia.includes(val);
                      return (
                        <button type="button" key={t} onClick={() => toggleTema(val)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                          style={{
                            backgroundColor: isSelected ? "#606C38" : "#FEFAE0",
                            color: isSelected ? "#FEFAE0" : "#4A3728",
                            border: `1.5px solid ${isSelected ? "#606C38" : "#E8C99A"}`
                          }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              )}

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#606C38', color: '#FEFAE0' }}
                >
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md"
                  style={{ borderColor: '#D4A373', color: '#4A3728', backgroundColor: 'transparent' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Toast />
    </div>
  );
}
