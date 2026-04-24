import { useState, useEffect } from "react";
import { 
  User, Mail, Lock, Calendar, MapPin, Home, 
  FileText, ArrowLeft, Save, Check, ChevronRight 
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useShop } from "../store/ShopContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Toast } from "./shop/Toast";
import { 
  validateDate, validatePassword, validateName 
} from "../utils/validators";

export function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, showToast } = useShop();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
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

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Manejo de fecha desglosada
  const initialDate = user?.fechaNacimiento || "";
  const [bDay, setBDay] = useState(initialDate ? initialDate.split("-")[2] : "");
  const [bMonth, setBMonth] = useState(initialDate ? parseInt(initialDate.split("-")[1], 10).toString() : "");
  const [bYear, setBYear] = useState(initialDate ? initialDate.split("-")[0] : "");

  useEffect(() => {
    if (bDay && bMonth && bYear) {
      const dateStr = `${bYear}-${bMonth.padStart(2, "0")}-${bDay.padStart(2, "0")}`;
      setFormData(prev => ({ ...prev, fechaNacimiento: dateStr }));
    }
  }, [bDay, bMonth, bYear]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTema = (tema: string) => {
    setFormData(prev => {
      const selected = prev.temasPreferencia.includes(tema)
        ? prev.temasPreferencia.filter(t => t !== tema)
        : [...prev.temasPreferencia, tema];
      return { ...prev, temasPreferencia: selected };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateError = validateDate(formData.fechaNacimiento);
    if (dateError) {
      showToast(dateError, "error");
      return;
    }

    const nameError = validateName(formData.nombres, "Nombres");
    if (nameError) {
      showToast(nameError, "error");
      return;
    }

    updateProfile({
      dni: formData.dni,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      name: `${formData.nombres} ${formData.apellidos}`.trim(),
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

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#FEFAE0' }}>
      {/* Header Estilizado */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E8C99A]/30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-[#4A3728]/10 text-[#4A3728]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-serif text-[#4A3728]">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#4A3728]">{user?.name}</p>
                <p className="text-[10px] text-[#D4A373] uppercase tracking-widest">{user?.role}</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-[#4A3728] flex items-center justify-center border-2 border-[#E8C99A]">
                <User className="w-5 h-5 text-[#D4A373]" />
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E8C99A]/20">
          
          {/* Cover / Profile Banner Area */}
          <div className="h-32 bg-[#4A3728] relative">
            <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-3xl bg-[#FEFAE0] p-1 shadow-lg">
               <div className="w-full h-full rounded-2xl bg-[#606C38] flex items-center justify-center">
                  <User className="w-10 h-10 text-[#FEFAE0]" />
               </div>
            </div>
          </div>

          <div className="pt-16 px-8 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold font-serif text-[#4A3728]">{formData.nombres} {formData.apellidos}</h2>
                <p className="text-sm text-[#D4A373] font-medium">@{formData.usuario} • {formData.correo}</p>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} className="bg-[#606C38] hover:bg-[#485229] text-white rounded-2xl px-6">
                  Editar Datos
                </Button>
              )}
            </div>

            {/* Contenido según estado (Vista o Edición) */}
            {!isEditing ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                <section>
                  <SectionHeader title="Información Personal" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoBox label="DNI" value={formData.dni} icon={<FileText />} />
                    <InfoBox label="Género" value={formData.genero || "No especificado"} icon={<User />} />
                    <InfoBox label="Nacimiento" value={formData.fechaNacimiento} icon={<Calendar />} />
                    <div className="sm:col-span-2 lg:col-span-3">
                      <InfoBox label="Dirección" value={formData.direccion} icon={<Home />} />
                    </div>
                  </div>
                </section>

                <section>
                  <SectionHeader title="Seguridad y Cuenta" />
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-[#FEFAE0]/50 border border-[#E8C99A]">
                    <div className="flex items-center gap-3">
                       <Lock className="w-5 h-5 text-[#D4A373]" />
                       <div>
                          <p className="text-sm font-bold text-[#4A3728]">Contraseña</p>
                          <p className="text-xs text-[#6B5344]">Actualizada recientemente</p>
                       </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordSection(!showPasswordSection)} 
                      className="border-[#D4A373] text-[#4A3728] hover:bg-[#D4A373]/10">
                      Cambiar Contraseña
                    </Button>
                  </div>

                  {showPasswordSection && (
                    <form onSubmit={handlePasswordSubmit} className="mt-4 p-6 rounded-2xl bg-white border-2 border-[#E8C99A] space-y-4 animate-in slide-in-from-top-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <Field label="Nueva Contraseña" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} icon={<Lock />} />
                         <Field label="Confirmar Nueva" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} icon={<Lock />} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setShowPasswordSection(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-[#4A3728] text-white">Actualizar</Button>
                      </div>
                    </form>
                  )}
                </section>

                {user?.role === 'cliente' && (
                  <section>
                    <SectionHeader title="Preferencias de Lectura" />
                    <div className="flex flex-wrap gap-2">
                      {formData.temasPreferencia.map(tema => (
                        <span key={tema} className="px-4 py-2 rounded-xl bg-[#F5EDD3] text-[#4A3728] text-xs font-bold border border-[#E8C99A]">
                          {tema.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              // FORMULARIO DE EDICIÓN
              <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <section className="space-y-4">
                  <SectionHeader title="Editando Perfil" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} icon={<User />} />
                    <Field label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} icon={<User />} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#4A3728] ml-1">Fecha de Nacimiento</Label>
                    <div className="flex gap-2">
                       <select value={bDay} onChange={e => setBDay(e.target.value)} className="flex-1 h-11 px-3 rounded-xl border border-[#E8C99A] bg-[#FEFAE0]/30 outline-none text-sm">
                          {Array.from({length:31}, (_,i)=>i+1).map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                       <select value={bMonth} onChange={e => setBMonth(e.target.value)} className="flex-1 h-11 px-3 rounded-xl border border-[#E8C99A] bg-[#FEFAE0]/30 outline-none text-sm">
                          {Array.from({length:12}, (_,i)=>i+1).map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                       <select value={bYear} onChange={e => setBYear(e.target.value)} className="flex-1 h-11 px-3 rounded-xl border border-[#E8C99A] bg-[#FEFAE0]/30 outline-none text-sm">
                          {Array.from({length:100}, (_,i)=>new Date().getFullYear()-13-i).map(y => <option key={y} value={y}>{y}</option>)}
                       </select>
                    </div>
                  </div>

                  <Field label="Lugar de Nacimiento" name="lugarNacimiento" value={formData.lugarNacimiento} onChange={handleChange} icon={<MapPin />} />
                  <Field label="Dirección" name="direccion" value={formData.direccion} onChange={handleChange} icon={<Home />} />
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#4A3728] ml-1">Género</Label>
                    <select name="genero" value={formData.genero} onChange={handleChange} className="w-full h-11 px-3 rounded-xl border border-[#E8C99A] bg-[#FEFAE0]/30 outline-none text-sm focus:border-[#4A3728]">
                       <option value="masculino">Masculino</option>
                       <option value="femenino">Femenino</option>
                       <option value="otro">Otro</option>
                    </select>
                  </div>
                </section>

                {user?.role === 'cliente' && (
                  <section className="space-y-4">
                    <SectionHeader title="Preferencias de Lectura" />
                    <div className="flex flex-wrap gap-2">
                       {["Ficción","No Ficción","Ciencia","Historia","Tecnología","Arte","Filosofía","Poesía","Biografía","Infantil","Juvenil","Novela Gráfica"].map(t => {
                          const isSelected = formData.temasPreferencia.includes(t.toLowerCase());
                          return (
                            <button key={t} type="button" onClick={() => toggleTema(t.toLowerCase())}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                isSelected ? "bg-[#4A3728] text-white border-[#4A3728]" : "bg-white text-[#6B5344] border-[#E8C99A]"
                              }`}>
                              {t}
                            </button>
                          )
                       })}
                    </div>
                  </section>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button type="submit" className="flex-1 bg-[#606C38] text-white h-12 rounded-2xl shadow-lg">
                    <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1 border-[#D4A373] text-[#4A3728] h-12 rounded-2xl">
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Toast />
    </div>
  );
}

// ── COMPONENTES AUXILIARES INTERNOS ──────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
       <h3 className="text-sm font-bold uppercase tracking-widest text-[#4A3728]">{title}</h3>
       <div className="h-px flex-1 bg-[#E8C99A]/40" />
    </div>
  );
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="p-4 rounded-2xl bg-[#FEFAE0]/30 border border-[#E8C99A]/40 flex gap-3 items-start">
       <div className="w-8 h-8 rounded-lg bg-[#4A3728]/5 flex items-center justify-center text-[#D4A373] shrink-0 font-bold [&>svg]:w-4 [&>svg]:h-4">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-bold text-[#D4A373] uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-[#4A3728] break-all">{value || "—"}</p>
       </div>
    </div>
  );
}

function Field({ label, icon, ...props }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <Label className="text-xs font-bold text-[#4A3728] ml-1">{label}</Label>
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4A373] group-focus-within:text-[#4A3728] transition-colors [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </span>
        <Input {...props} className="pl-10 h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A] focus:border-[#4A3728] transition-all" />
      </div>
    </div>
  );
}
