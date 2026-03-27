import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useShop } from "../../store/ShopContext";

// ─── Tipos locales solo para la vista de tabla ───────────────
interface AdminRow {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  usuario: string;
  active: boolean;
  createdAt: Date;
}

const INITIAL_ADMINS: AdminRow[] = [
  {
    id: "U-ADM-001",
    nombres: "Carlos", apellidos: "Rodríguez Vargas",
    correo: "admin@biblion.co", usuario: "carlos.admin",
    active: true, createdAt: new Date("2024-01-15"),
  },
];

const emptyForm = {
  nombres: "", apellidos: "", fechaNacimiento: "", lugarNacimiento: "",
  direccion: "", genero: "", correo: "", usuario: "",
  contrasena: "", confirmar: "",
};

function validateAdmin(f: typeof emptyForm) {
  const e: Record<string, string> = {};
  if (!f.nombres.trim()) e.nombres = "Los nombres son obligatorios";
  if (!f.apellidos.trim()) e.apellidos = "Los apellidos son obligatorios";
  if (!f.fechaNacimiento) e.fechaNacimiento = "La fecha de nacimiento es obligatoria";
  if (!f.lugarNacimiento.trim()) e.lugarNacimiento = "El lugar de nacimiento es obligatorio";
  if (!f.direccion.trim()) e.direccion = "La dirección es obligatoria";
  if (!f.genero) e.genero = "Selecciona un género";
  if (!f.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo)) e.correo = "Correo inválido";
  if (!f.usuario || f.usuario.length < 4) e.usuario = "Usuario mínimo 4 caracteres";
  if (/\s/.test(f.usuario)) e.usuario = "Sin espacios en el usuario";
  if (!f.contrasena || f.contrasena.length < 8) e.contrasena = "Contraseña mínimo 8 caracteres";
  if (/\s/.test(f.contrasena)) e.contrasena = "Sin espacios en la contraseña";
  if (f.contrasena !== f.confirmar) e.confirmar = "Las contraseñas no coinciden";
  return e;
}

export function RootPanel() {
  // ← Conexión real al contexto
  const { registerAdmin } = useShop();

  const [tab, setTab] = useState<"admins" | "create" | "credentials">("admins");
  const [admins, setAdmins] = useState<AdminRow[]>(INITIAL_ADMINS);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Root credentials form (M7-HU2)
  const [rootForm, setRootForm] = useState({ currentPass: "", newPass: "", confirmPass: "" });
  const [rootErrors, setRootErrors] = useState<Record<string, string>>({});
  const [savingRoot, setSavingRoot] = useState(false);
  const [showRootPasses, setShowRootPasses] = useState({ c: false, n: false, conf: false });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    setServerError("");
    if (touched[name]) {
      const errs = validateAdmin(updated);
      setErrors(p => ({ ...p, [name]: errs[name] || "" }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    const errs = validateAdmin(form);
    setErrors(p => ({ ...p, [name]: errs[name] || "" }));
  }

  function handleSubmitAdmin() {
    setServerError("");
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    const errs = validateAdmin(form);
    setErrors(errs);
    if (Object.values(errs).some(v => v)) return;

    setSaving(true);
    setTimeout(() => {
      // ← Llamada real al contexto — guarda en registeredUsers para que pueda hacer login
      const result = registerAdmin({
        nombres:    form.nombres,
        apellidos:  form.apellidos,
        correo:     form.correo,
        usuario:    form.usuario,
        contrasena: form.contrasena,
      });

      setSaving(false);

      if (!result.success) {
        setServerError(result.error || "Error al crear el administrador.");
        if (result.error?.includes("correo")) {
          setErrors(p => ({ ...p, correo: result.error! }));
          setTouched(p => ({ ...p, correo: true }));
        }
        if (result.error?.includes("usuario")) {
          setErrors(p => ({ ...p, usuario: result.error! }));
          setTouched(p => ({ ...p, usuario: true }));
        }
        return;
      }

      // Agregar a la tabla de visualización
      const newRow: AdminRow = {
        id: result.id!,
        nombres: form.nombres, apellidos: form.apellidos,
        correo: form.correo.trim().toLowerCase(),
        usuario: form.usuario.trim().toLowerCase(),
        active: true, createdAt: new Date(),
      };
      setAdmins(prev => [...prev, newRow]);
      setForm({ ...emptyForm });
      setErrors({}); setTouched({});
      setSuccessMsg(
        `✓ Administrador "${newRow.nombres} ${newRow.apellidos}" creado. ` +
        `Puede iniciar sesión con: ${newRow.usuario} / ${form.contrasena}`
      );
      setTab("admins");
      setTimeout(() => setSuccessMsg(""), 8000);
    }, 800);
  }

  function handleRootCredentials() {
    const e: Record<string, string> = {};
    if (!rootForm.currentPass) e.currentPass = "Ingresa tu contraseña actual";
    else if (rootForm.currentPass !== "root1234") e.currentPass = "Contraseña actual incorrecta";
    if (!rootForm.newPass || rootForm.newPass.length < 8) e.newPass = "Nueva contraseña mínimo 8 caracteres";
    if (/\s/.test(rootForm.newPass)) e.newPass = "Sin espacios en la contraseña";
    if (rootForm.newPass !== rootForm.confirmPass) e.confirmPass = "Las contraseñas no coinciden";
    setRootErrors(e);
    if (Object.values(e).some(v => v)) return;
    setSavingRoot(true);
    setTimeout(() => {
      setRootForm({ currentPass: "", newPass: "", confirmPass: "" });
      setSavingRoot(false);
      setSuccessMsg("✓ Credenciales del usuario root actualizadas correctamente");
      setTab("admins");
      setTimeout(() => setSuccessMsg(""), 4000);
    }, 800);
  }

  const FieldErr = ({ name, errs }: { name: string; errs: Record<string, string> }) =>
    errs[name] ? <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{errs[name]}</p> : null;

  const inputStyle = (name: string) => ({
    border: `1.5px solid ${touched[name] && errors[name] ? "#C0392B" : "#E8C99A"}`,
    background: "#FEFAE0", color: "#4A3728",
  });

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-start mb-7">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
            Configuración Root
          </h1>
          <p className="text-sm" style={{ color: "#6B5344", opacity: 0.8 }}>
            M7-HU1: Crear administradores · M7-HU2: Editar credenciales root
          </p>
        </div>
        <div className="flex gap-2">
          {tab !== "create" && (
            <button onClick={() => { setForm({ ...emptyForm }); setErrors({}); setTouched({}); setServerError(""); setTab("create"); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              + Crear administrador
            </button>
          )}
          {tab !== "credentials" && (
            <button onClick={() => { setRootForm({ currentPass: "", newPass: "", confirmPass: "" }); setRootErrors({}); setTab("credentials"); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80"
              style={{ borderColor: "#D4A373", color: "#4A3728" }}>
              Cambiar contraseña root
            </button>
          )}
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMsg && (
        <div className="rounded-xl px-5 py-3.5 mb-5 flex items-start gap-3"
          style={{ background: "rgba(96,108,56,0.1)", border: "1.5px solid #606C38" }}>
          <span style={{ color: "#606C38", marginTop: 2 }}>✓</span>
          <p className="text-sm font-medium" style={{ color: "#606C38" }}>{successMsg}</p>
        </div>
      )}

      {/* ── TABLA DE ADMINISTRADORES ── */}
      {tab === "admins" && (
        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#4A3728", color: "#FEFAE0" }}>
                {["ID", "Nombre", "Usuario", "Correo", "Creado", "Estado", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#FEFAE0" }}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background: "#F5EDD3", color: "#4A3728" }}>
                      {a.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "#4A3728" }}>
                    {a.nombres} {a.apellidos}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "#6B5344" }}>{a.usuario}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B5344" }}>{a.correo}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B5344" }}>
                    {a.createdAt.toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: a.active ? "rgba(96,108,56,0.1)" : "rgba(192,57,43,0.1)", color: a.active ? "#606C38" : "#C0392B" }}>
                      {a.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, active: !x.active } : x))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: a.active ? "rgba(192,57,43,0.08)" : "rgba(96,108,56,0.08)", color: a.active ? "#C0392B" : "#606C38" }}>
                      {a.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FORMULARIO: Crear Administrador ── */}
      {tab === "create" && (
        <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setTab("admins"); setServerError(""); setErrors({}); setTouched({}); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F5EDD3", color: "#4A3728" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Crear Administrador
            </h2>
          </div>

          <div className="rounded-xl p-3 mb-5 text-xs" style={{ background: "#F5EDD3", color: "#6B5344" }}>
            ⚠️ Solo el usuario root puede crear administradores. Los administradores no pueden comprar ni reservar libros.
          </div>

          {/* Error de servidor */}
          {serverError && (
            <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2"
              style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm" style={{ color: "#C0392B" }}>{serverError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {([
              ["nombres",        "Nombres *",              "text",  "Juan Carlos"],
              ["apellidos",      "Apellidos *",            "text",  "Rodríguez García"],
              ["fechaNacimiento","Fecha de nacimiento *",  "date",  ""],
              ["lugarNacimiento","Lugar de nacimiento *",  "text",  "Pereira, Colombia"],
              ["direccion",      "Dirección *",            "text",  "Calle 100 #15-20"],
              ["correo",         "Correo electrónico *",   "email", "admin@biblion.co"],
              ["usuario",        "Nombre de usuario *",    "text",  "nuevo.admin"],
            ] as [string, string, string, string][]).map(([name, label, type, placeholder]) => (
              <div key={name}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>{label}</label>
                <input name={name} type={type} value={(form as any)[name]}
                  onChange={handleChange} onBlur={handleBlur as any}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle(name)} />
                <FieldErr name={name} errs={errors} />
              </div>
            ))}

            {/* Género */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Género *</label>
              <select name="genero" value={form.genero} onChange={handleChange} onBlur={handleBlur as any}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={inputStyle("genero")}>
                <option value="">Seleccionar…</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero-no-decir">Prefiero no decir</option>
              </select>
              <FieldErr name="genero" errs={errors} />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Contraseña *</label>
              <div className="relative">
                <input name="contrasena" type={showPass ? "text" : "password"} value={form.contrasena}
                  onChange={handleChange} onBlur={handleBlur as any} placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 pr-10 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle("contrasena")} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldErr name="contrasena" errs={errors} />
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Confirmar contraseña *</label>
              <div className="relative">
                <input name="confirmar" type={showConfirm ? "text" : "password"} value={form.confirmar}
                  onChange={handleChange} onBlur={handleBlur as any} placeholder="Repite la contraseña"
                  className="w-full px-4 pr-10 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle("confirmar")} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldErr name="confirmar" errs={errors} />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setTab("admins"); setServerError(""); setErrors({}); setTouched({}); }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: "#D4A373", color: "#4A3728" }}>
              Cancelar
            </button>
            <button onClick={handleSubmitAdmin} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando…</>
                : "Crear Administrador"}
            </button>
          </div>
        </div>
      )}

      {/* ── CREDENCIALES ROOT (M7-HU2) ── */}
      {tab === "credentials" && (
        <div className="max-w-md rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setTab("admins")}
              className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F5EDD3", color: "#4A3728" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              Cambiar contraseña Root
            </h2>
          </div>
          <div className="rounded-xl p-3 mb-5 text-xs" style={{ background: "#F5EDD3", color: "#6B5344" }}>
            El ID del root no puede modificarse. Solo la contraseña de acceso al sistema.
          </div>

          {([
            ["currentPass", "Contraseña actual *",          showRootPasses.c,    () => setShowRootPasses(p => ({ ...p, c: !p.c }))],
            ["newPass",     "Nueva contraseña *",           showRootPasses.n,    () => setShowRootPasses(p => ({ ...p, n: !p.n }))],
            ["confirmPass", "Confirmar nueva contraseña *", showRootPasses.conf, () => setShowRootPasses(p => ({ ...p, conf: !p.conf }))],
          ] as [string, string, boolean, () => void][]).map(([name, label, show, toggle]) => (
            <div key={name} className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>{label}</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={(rootForm as any)[name]}
                  onChange={e => setRootForm(p => ({ ...p, [name]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 pr-10 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: `1.5px solid ${rootErrors[name] ? "#C0392B" : "#E8C99A"}`, background: "#FEFAE0", color: "#4A3728" }} />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#D4A373" }}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {rootErrors[name] && <p className="text-xs mt-1" style={{ color: "#C0392B" }}>{rootErrors[name]}</p>}
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setTab("admins")}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "#D4A373", color: "#4A3728" }}>
              Cancelar
            </button>
            <button onClick={handleRootCredentials} disabled={savingRoot}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90"
              style={{ background: "#4A3728", color: "#FEFAE0" }}>
              {savingRoot
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Actualizando…</>
                : "Actualizar credenciales"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
