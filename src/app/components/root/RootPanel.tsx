import { useState } from "react";
import { Eye, EyeOff, Mail, AlertTriangle } from "lucide-react";
import { useShop } from "../../store/ShopContext";
import { generateTempPassword, sendAdminWelcomeEmail } from "../../utils/birthdayEmail";

const emptyForm = { correo: "", confirmarCorreo: "" };

function validateAdminForm(f: typeof emptyForm) {
  const e: Record<string, string> = {};
  if (!f.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo))
    e.correo = "Correo electrónico inválido";
  if (f.correo !== f.confirmarCorreo)
    e.confirmarCorreo = "Los correos no coinciden";
  return e;
}

export function RootPanel() {
  // ← Conexión real al contexto
  const { registerAdmin, adminsList, toggleAdminStatus, usersList, toggleUserStatus, updateProfile, verifyPassword, showToast } = useShop();

  const [tab, setTab] = useState<"admins" | "users" | "create" | "credentials">("admins");
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);

  // Root credentials form (M7-HU2)
  const [rootForm, setRootForm] = useState({ currentPass: "", newPass: "", confirmPass: "" });
  const [rootErrors, setRootErrors] = useState<Record<string, string>>({});
  const [savingRoot, setSavingRoot] = useState(false);
  const [showRootPasses, setShowRootPasses] = useState({ c: false, n: false, conf: false });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    setServerError("");
    if (touched[name]) {
      const errs = validateAdminForm(updated);
      setErrors(p => ({ ...p, [name]: errs[name] || "" }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    const errs = validateAdminForm(form);
    setErrors(p => ({ ...p, [name]: errs[name] || "" }));
  }

  function handleOpenConfirmModal() {
    setServerError("");
    setTouched({ correo: true, confirmarCorreo: true });
    const errs = validateAdminForm(form);
    setErrors(errs);
    if (Object.values(errs).some(v => v)) return;
    setConfirmModal(true);
  }

  function handleConfirmCreateAdmin() {
    setConfirmModal(false);
    const tempPass = generateTempPassword();
    const correo   = form.correo;
    // Nombre de usuario derivado del prefijo del correo
    const usuario  = correo.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
    setSaving(true);
    setTimeout(() => {
      const result = registerAdmin({ correo, usuario, contrasena: tempPass });
      setSaving(false);
      if (!result.success) {
        setServerError(result.error || "Error al crear el administrador.");
        if (result.error?.includes("correo")) {
          setErrors(p => ({ ...p, correo: result.error! }));
          setTouched(p => ({ ...p, correo: true }));
        }
        return;
      }
      setForm({ ...emptyForm });
      setErrors({}); setTouched({});
      setSuccessMsg(`✓ Administrador creado. Enviando correo a ${correo}…`);
      setTab("admins");

      sendAdminWelcomeEmail(correo, tempPass)
        .then(() => {
          setSuccessMsg(`✓ Administrador creado. Correo con clave temporal enviado a ${correo}.`);
        })
        .catch((err) => {
          console.error("[Biblion] Error enviando correo admin:", err);
          showToast(`Admin creado, pero el correo no se pudo enviar: ${err?.text ?? err?.message ?? "error desconocido"}`, "error");
          setSuccessMsg(`✓ Administrador creado (${correo}). El correo falló — revisa la consola.`);
        });

      setTimeout(() => setSuccessMsg(""), 10000);
    }, 800);
  }

  function handleRootCredentials() {
    const e: Record<string, string> = {};
    if (!rootForm.currentPass) {
      e.currentPass = "Ingresa tu contraseña actual";
    } else if (!verifyPassword(rootForm.currentPass)) {
      e.currentPass = "La contraseña actual es incorrecta";
    }

    const v = rootForm.newPass;
    if (!v) e.newPass = "La contraseña es obligatoria";
    else if (/\s/.test(v)) e.newPass = "La contraseña no puede contener espacios en blanco";
    else if (v.length < 8) e.newPass = "La contraseña debe tener al menos 8 caracteres";
    else if (!/[A-Z]/.test(v)) e.newPass = "Debe incluir al menos una letra mayúscula";
    else if (!/[0-9]/.test(v)) e.newPass = "Debe incluir al menos un número";
    else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) e.newPass = "Debe incluir al menos un carácter especial";

    if (rootForm.newPass !== rootForm.confirmPass) e.confirmPass = "Las contraseñas no coinciden";
    setRootErrors(e);
    if (Object.values(e).some(v => v)) return;

    setSavingRoot(true);
    setTimeout(() => {
      updateProfile({ password: rootForm.newPass });
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

      {/* Sub-navegación Cuentas */}
      {(tab === "admins" || tab === "users") && (
        <div className="flex gap-4 mb-5 border-b" style={{ borderColor: "#E8C99A" }}>
          <button onClick={() => setTab("admins")}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${tab === "admins" ? "" : "border-transparent opacity-60"}`}
            style={{ borderColor: tab === "admins" ? "#4A3728" : "transparent", color: "#4A3728" }}>
            Administradores
          </button>
          <button onClick={() => setTab("users")}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${tab === "users" ? "" : "border-transparent opacity-60"}`}
            style={{ borderColor: tab === "users" ? "#4A3728" : "transparent", color: "#4A3728" }}>
            Usuarios (Clientes)
          </button>
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
              {adminsList.map((a, i) => (
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
                      onClick={() => toggleAdminStatus(a.id)}
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

      {/* ── TABLA DE USUARIOS ── */}
      {tab === "users" && (
        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#606C38", color: "#FEFAE0" }}>
                {["ID", "Nombre", "Usuario", "Correo", "Creado", "Estado", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersList.map((a, i) => (
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
                      onClick={() => toggleUserStatus(a.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: a.active ? "rgba(192,57,43,0.08)" : "rgba(96,108,56,0.08)", color: a.active ? "#C0392B" : "#606C38" }}>
                      {a.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr style={{ background: "#fff" }}>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "#6B5344" }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4"
          style={{ background: "rgba(74,55,40,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-8 text-center bg-white"
            style={{ boxShadow: "0 24px 80px rgba(74,55,40,0.3)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(74,55,40,0.08)" }}>
              <Mail className="w-7 h-7" style={{ color: "#4A3728" }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4A3728" }}>
              ¿Crear administrador?
            </h3>
            <p className="text-sm mb-3" style={{ color: "#6B5344" }}>
              Se creará la siguiente cuenta administrador:
            </p>
            <div className="rounded-xl px-4 py-3 my-2 text-left space-y-1.5"
              style={{ background: "#F5EDD3" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#6B5344" }}>Usuario</span>
                <span className="font-bold font-mono" style={{ color: "#4A3728" }}>
                  {form.correo.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "")}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#6B5344" }}>Correo</span>
                <span className="font-bold break-all" style={{ color: "#4A3728" }}>{form.correo}</span>
              </div>
            </div>
            <p className="text-xs mt-3 mb-6" style={{ color: "#6B5344" }}>
              Se enviará una clave temporal al correo indicado para que el administrador pueda ingresar al sistema.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#D4A373", color: "#4A3728" }}>
                Cancelar
              </button>
              <button onClick={handleConfirmCreateAdmin}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{ background: "#4A3728", color: "#FEFAE0" }}>
                Sí, crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FORMULARIO: Crear Administrador ── */}
      {tab === "create" && (
        <div className="max-w-md rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 3px 16px rgba(74,55,40,0.08)" }}>
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

          <div className="rounded-xl p-3 mb-5 text-xs flex items-start gap-2" style={{ background: "#F5EDD3", color: "#6B5344" }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Solo el usuario root puede crear administradores. Se generará una clave temporal y se enviará al correo indicado.</span>
          </div>

          {serverError && (
            <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2"
              style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid #C0392B" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm" style={{ color: "#C0392B" }}>{serverError}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {/* ── Correo ── */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Correo electrónico *</label>
              <input name="correo" type="email" value={form.correo}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="admin@biblion.co"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle("correo")} />
              <FieldErr name="correo" errs={errors} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#4A3728" }}>Confirmar correo electrónico *</label>
              <input name="confirmarCorreo" type="email" value={form.confirmarCorreo}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Repite el correo electrónico"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle("confirmarCorreo")} />
              <FieldErr name="confirmarCorreo" errs={errors} />
            </div>

            {/* Preview del usuario que se generará */}
            {form.correo && !errors.correo && (
              <div className="rounded-xl px-4 py-2.5 text-xs flex items-center gap-2"
                style={{ background: "rgba(96,108,56,0.08)", border: "1.5px solid #606C38" }}>
                <span style={{ color: "#606C38" }}>👤</span>
                <span style={{ color: "#4A3728" }}>
                  Nombre de usuario asignado:{" "}
                  <strong className="font-mono">
                    {form.correo.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "") || "—"}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setTab("admins"); setServerError(""); setErrors({}); setTouched({}); }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: "#D4A373", color: "#4A3728" }}>
              Cancelar
            </button>
            <button onClick={handleOpenConfirmModal} disabled={saving}
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
