import { useState, useEffect } from "react";
import {
  BookOpen, User, Mail, Lock, Calendar,
  MapPin, Home, FileText, Eye, EyeOff, ChevronRight, ChevronLeft, Check
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useShop } from "../store/ShopContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  validateDNI, validateName, validateDate, validateEmail, 
  validateUsername, validatePassword, validateConfirm, getPasswordStrength 
} from "../utils/validators";

interface FieldError { [key: string]: string }

const STEPS = [
  { id: 1, title: "Personal", icon: <User className="w-4 h-4" /> },
  { id: 2, title: "Cuenta", icon: <Lock className="w-4 h-4" /> },
  { id: 3, title: "Intereses", icon: <BookOpen className="w-4 h-4" /> },
];

export function Register() {
  const navigate = useNavigate();
  const { register } = useShop();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dni: "", nombres: "", apellidos: "", fechaNacimiento: "",
    lugarNacimiento: "", direccion: "", genero: "", correo: "",
    temasPreferencia: [] as string[],
    usuario: "", contrasena: "", confirmarContrasena: "",
  });
  const [errors, setErrors]   = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const [bDay, setBDay] = useState("");
  const [bMonth, setBMonth] = useState("");
  const [bYear, setBYear] = useState("");

  useEffect(() => {
    if (bDay && bMonth && bYear) {
      const dateStr = `${bYear}-${bMonth.padStart(2, "0")}-${bDay.padStart(2, "0")}`;
      setFormData(prev => ({ ...prev, fechaNacimiento: dateStr }));
    } else {
      setFormData(prev => ({ ...prev, fechaNacimiento: "" }));
    }
  }, [bDay, bMonth, bYear]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FieldError = {};
    
    if (currentStep === 1) {
      newErrors.dni = validateDNI(formData.dni);
      newErrors.nombres = validateName(formData.nombres, "Los nombres");
      newErrors.apellidos = validateName(formData.apellidos, "Los apellidos");
      newErrors.fechaNacimiento = validateDate(formData.fechaNacimiento);
      newErrors.lugarNacimiento = !formData.lugarNacimiento.trim() ? "El lugar de nacimiento es obligatorio" : "";
      newErrors.direccion = !formData.direccion.trim() ? "La dirección es obligatoria" : "";
      newErrors.genero = !formData.genero ? "Selecciona un género" : "";
    } else if (currentStep === 2) {
      newErrors.correo = validateEmail(formData.correo);
      newErrors.usuario = validateUsername(formData.usuario);
      newErrors.contrasena = validatePassword(formData.contrasena);
      newErrors.confirmarContrasena = validateConfirm(formData.contrasena, formData.confirmarContrasena);
    } else if (currentStep === 3) {
      newErrors.temasPreferencia = formData.temasPreferencia.length === 0 ? "Selecciona al menos un tema" : "";
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    
    const relevantKeys = Object.keys(newErrors);
    setTouched(prev => {
      const next = { ...prev };
      relevantKeys.forEach(k => next[k] = true);
      return next;
    });

    return !relevantKeys.some(k => newErrors[k] !== "");
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
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
    if (!validateStep(3)) return;

    setLoading(true);
    setTimeout(() => {
      const result = register(formData);
      setLoading(false);

      if (!result.success) {
        setServerError(result.error || "Error al crear la cuenta.");
        return;
      }
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return <SuccessView formData={formData} onAction={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ backgroundColor: "#FEFAE0" }}>
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl shadow-xl p-8 bg-white border border-[#E8C99A]/30">
          
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-transform hover:scale-105" style={{ backgroundColor: "#4A3728" }}>
              <BookOpen className="w-8 h-8 text-[#D4A373]" />
            </Link>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Únete a Biblion
            </h1>
            <p className="text-sm text-[#6B5344]/70">Explora miles de historias con nosotros</p>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between mb-12 relative px-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E8C99A]/30 -translate-y-1/2 z-0 mx-10" />
            {STEPS.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
                    step >= s.id ? "bg-[#4A3728] border-[#E8C99A] text-white scale-110" : "bg-white border-[#E8C99A]/30 text-[#D4A373]"
                  }`}
                >
                  {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.id ? "text-[#4A3728]" : "text-[#D4A373]/60"}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm animate-in fade-in zoom-in">
              <FileText className="w-4 h-4" /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="DNI" name="dni" value={formData.dni} error={touched.dni ? errors.dni : ""} onChange={handleChange} placeholder="12345678" icon={<FileText />} />
                  <div className="space-y-1.5">
                    <Label className="text-[#4A3728] font-semibold text-xs ml-1">Fecha de Nacimiento *</Label>
                    <div className="flex gap-2">
                      <DateSelect value={bDay} onChange={setBDay} options={Array.from({length:31}, (_,i)=>i+1)} placeholder="Día" error={touched.fechaNacimiento && !!errors.fechaNacimiento} />
                      <DateSelect value={bMonth} onChange={setBMonth} options={Array.from({length:12}, (_,i)=>i+1)} placeholder="Mes" error={touched.fechaNacimiento && !!errors.fechaNacimiento} />
                      <DateSelect value={bYear} onChange={setBYear} options={Array.from({length:100}, (_,i)=>new Date().getFullYear()-13-i)} placeholder="Año" error={touched.fechaNacimiento && !!errors.fechaNacimiento} />
                    </div>
                    {touched.fechaNacimiento && errors.fechaNacimiento && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.fechaNacimiento}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nombres" name="nombres" value={formData.nombres} error={touched.nombres ? errors.nombres : ""} onChange={handleChange} placeholder="Juan" icon={<User />} />
                  <Field label="Apellidos" name="apellidos" value={formData.apellidos} error={touched.apellidos ? errors.apellidos : ""} onChange={handleChange} placeholder="Pérez" icon={<User />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Lugar de Nacimiento" name="lugarNacimiento" value={formData.lugarNacimiento} error={touched.lugarNacimiento ? errors.lugarNacimiento : ""} onChange={handleChange} placeholder="Ciudad, País" icon={<MapPin />} />
                  <div className="space-y-1.5">
                    <Label className="text-[#4A3728] font-semibold text-xs ml-1">Género *</Label>
                    <select name="genero" value={formData.genero} onChange={handleChange} 
                      className={`w-full px-3 py-2 rounded-xl border bg-[#FEFAE0]/30 outline-none h-10 text-sm transition-all ${touched.genero && errors.genero ? "border-red-500" : "border-[#E8C99A] focus:border-[#4A3728]"}`}>
                      <option value="">Seleccionar...</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                    {touched.genero && errors.genero && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.genero}</p>}
                  </div>
                </div>
                <Field label="Dirección de Residencia" name="direccion" value={formData.direccion} error={touched.direccion ? errors.direccion : ""} onChange={handleChange} placeholder="Calle 123 #45-67" icon={<Home />} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <Field label="Correo Electrónico" name="correo" type="email" value={formData.correo} error={touched.correo ? errors.correo : ""} onChange={handleChange} placeholder="ejemplo@correo.com" icon={<Mail />} />
                <Field label="Nombre de Usuario" name="usuario" value={formData.usuario} error={touched.usuario ? errors.usuario : ""} onChange={handleChange} placeholder="usuario123" icon={<User />} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <Label className="text-[#4A3728] font-semibold text-xs ml-1">Contraseña *</Label>
                    <Input name="contrasena" type={showPass ? "text" : "password"} value={formData.contrasena} onChange={handleChange} className={`pr-10 h-10 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A] focus:border-[#4A3728] ${touched.contrasena && errors.contrasena ? "border-red-500" : ""}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-8 text-[#D4A373] hover:text-[#4A3728] transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {formData.contrasena && <PasswordStrength score={getPasswordStrength(formData.contrasena).score} />}
                    {touched.contrasena && errors.contrasena && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.contrasena}</p>}
                  </div>
                  <div className="space-y-1.5 relative">
                    <Label className="text-[#4A3728] font-semibold text-xs ml-1">Confirmar Contraseña *</Label>
                    <Input name="confirmarContrasena" type={showConfirm ? "text" : "password"} value={formData.confirmarContrasena} onChange={handleChange} className={`pr-10 h-10 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A] focus:border-[#4A3728] ${touched.confirmarContrasena && errors.confirmarContrasena ? "border-red-500" : ""}`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-8 text-[#D4A373] hover:text-[#4A3728] transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {touched.confirmarContrasena && errors.confirmarContrasena && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.confirmarContrasena}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="text-center mb-4">
                  <p className="text-sm text-[#6B5344]">Selecciona al menos un tema que te interese para personalizar tu catálogo</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Ficción","No Ficción","Ciencia","Historia","Tecnología","Arte","Filosofía","Poesía","Biografía","Infantil","Juvenil","Novela Gráfica"].map(t => {
                    const isSelected = formData.temasPreferencia.includes(t.toLowerCase());
                    return (
                      <button key={t} type="button" onClick={() => toggleTema(t.toLowerCase())}
                        className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 border ${
                          isSelected ? "bg-[#4A3728] text-white border-[#4A3728] shadow-md scale-105" : "bg-[#FEFAE0]/30 text-[#6B5344] border-[#E8C99A] hover:bg-[#E8C99A]/20"
                        }`}>
                        {t}
                      </button>
                    )
                  })}
                </div>
                {touched.temasPreferencia && errors.temasPreferencia && <p className="text-center text-xs text-red-500">{errors.temasPreferencia}</p>}
              </div>
            )}

            <div className="flex gap-3 pt-6">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1 rounded-2xl border-[#E8C99A] text-[#4A3728] h-12">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNext} className="flex-1 bg-[#4A3728] hover:bg-[#32251a] text-[#FEFAE0] rounded-2xl h-12 shadow-lg shadow-[#4A3728]/20">
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="flex-1 bg-[#606C38] hover:bg-[#485229] text-white rounded-2xl h-12 shadow-lg shadow-[#606C38]/20">
                  {loading ? "Creando cuenta..." : "Completar Registro"}
                </Button>
              )}
            </div>
            
            <div className="text-center mt-6">
              <Link to="/login" className="text-xs text-[#D4A373] hover:text-[#4A3728] transition-colors font-semibold">
                ¿Ya tienes una cuenta? Inicia sesión aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTES INTERNOS ────────────────────────────────────────

function Field({ label, error, icon, ...props }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <Label className="text-[#4A3728] font-semibold text-xs ml-1">{label} *</Label>
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4A373] group-focus-within:text-[#4A3728] transition-colors [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </span>
        <Input {...props} className={`pl-10 h-10 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A] focus:border-[#4A3728] transition-all ${error ? "border-red-500" : ""}`} />
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}

function DateSelect({ value, onChange, options, placeholder, error }: any) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`flex-1 h-10 px-2 rounded-xl border text-xs bg-[#FEFAE0]/30 outline-none transition-all ${error ? "border-red-500" : "border-[#E8C99A] focus:border-[#4A3728]"}`}>
      <option value="">{placeholder}</option>
      {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function PasswordStrength({ score }: { score: number }) {
  const colors = ["bg-gray-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-green-600"];
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= score ? colors[score] : "bg-gray-100"}`} />
      ))}
    </div>
  );
}

function SuccessView({ formData, onAction }: any) {
  const [showPass, setShowPass] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FEFAE0" }}>
      <div className="w-full max-w-md rounded-3xl shadow-2xl p-10 text-center bg-white border border-[#E8C99A]/20">
        <div className="w-20 h-20 rounded-2xl bg-[#606C38] flex items-center justify-center mx-auto mb-6 rotate-3">
          <Check className="w-10 h-10 text-[#FEFAE0]" />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
          ¡Bienvenido, {formData.nombres}!
        </h2>
        <p className="text-sm text-[#6B5344] mb-8">Tu cuenta ha sido creada exitosamente. Ya puedes empezar a explorar nuestra colección.</p>
        
        <div className="bg-[#FEFAE0] rounded-2xl p-6 mb-8 text-left border border-[#E8C99A]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#4A3728]/60 mb-4">Resumen de credenciales</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#6B5344]">Usuario</span>
              <span className="text-xs font-bold font-mono text-[#4A3728]">{formData.usuario}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#6B5344]">Email</span>
              <span className="text-xs font-bold text-[#4A3728]">{formData.correo}</span>
            </div>
            <div className="flex justify-between items-center group relative">
              <span className="text-xs text-[#6B5344]">Contraseña</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-[#4A3728]">
                  {showPass ? formData.contrasena : "••••••••"}
                </span>
                <button onClick={() => setShowPass(!showPass)} className="text-[#D4A373] hover:text-[#4A3728] transition-colors">
                  {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onAction} className="w-full bg-[#4A3728] hover:bg-[#32251a] text-[#FEFAE0] rounded-2xl h-12 shadow-lg">
          Comenzar ahora
        </Button>
      </div>
    </div>
  );
}
