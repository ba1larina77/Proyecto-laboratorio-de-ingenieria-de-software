import { LogOut, Save, Mail, Bell, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { validateDate } from "../../utils/validators";

interface ModalProps {
  onClose: () => void;
}

export function LogoutModal({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-[#4A3728]/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl p-8 text-center bg-white shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold mb-2 font-serif text-[#4A3728]">¿Cerrar sesión?</h3>
        <p className="text-sm mb-6 text-[#6B5344]">Tu sesión activa en este dispositivo será finalizada.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl">Cerrar Sesión</Button>
        </div>
      </div>
    </div>
  );
}

export function SubscribeModal({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl p-8 text-center bg-white shadow-2xl relative border border-[#E8C99A]">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 bg-[#F5EDD3]">
          <Mail className="w-8 h-8 text-[#D4A373]" />
        </div>
        <h3 className="text-2xl font-bold mb-3 font-serif text-[#4A3728]">¡Mantente al día!</h3>
        <p className="text-sm mb-7 leading-relaxed text-[#6B5344]">
          Suscríbete para recibir notificaciones sobre nuevos títulos y habilitar la sección de <strong>Novedades</strong> en tu catálogo.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl border-[#D4A373] text-[#4A3728]">Más tarde</Button>
          <Button onClick={onConfirm} className="flex-1 bg-[#606C38] hover:bg-[#485229] text-white rounded-xl shadow-lg shadow-[#606C38]/20">¡Suscribirme!</Button>
        </div>
        <button onClick={onCancel} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"><X className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

export function AdminCompleteProfileModal({ isOpen, data, onChange, onSubmit, onLogout, showToast }: any) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateDate(data.fechaNacimiento);
    if (error) {
      showToast(error, "error");
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border p-10 border-[#E8C99A]">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-12 h-12 rounded-2xl bg-[#4A3728] flex items-center justify-center shadow-lg">
              <LogOut className="w-6 h-6 text-[#D4A373] rotate-180" />
           </div>
           <div>
              <h2 className="text-2xl font-bold font-serif text-[#4A3728]">Completar Perfil Admin</h2>
              <p className="text-xs text-[#6B5344]">Información obligatoria para gestionar la biblioteca</p>
           </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <Label className="text-xs font-bold text-[#4A3728] ml-1">DNI *</Label>
                <Input value={data.dni} onChange={e => onChange({...data, dni: e.target.value})} required className="h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A]" />
             </div>
             <div>
                <Label className="text-xs font-bold text-[#4A3728] ml-1">Nombres *</Label>
                <Input value={data.nombres} onChange={e => onChange({...data, nombres: e.target.value})} required className="h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A]" />
             </div>
             <div>
                <Label className="text-xs font-bold text-[#4A3728] ml-1">Apellidos *</Label>
                <Input value={data.apellidos} onChange={e => onChange({...data, apellidos: e.target.value})} required className="h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A]" />
             </div>
             <div>
                <Label className="text-xs font-bold text-[#4A3728] ml-1">Fecha Nacimiento *</Label>
                <Input type="date" value={data.fechaNacimiento} onChange={e => onChange({...data, fechaNacimiento: e.target.value})} required className="h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A]" />
             </div>
             <div>
                <Label className="text-xs font-bold text-[#4A3728] ml-1">Lugar Nacimiento *</Label>
                <Input value={data.lugarNacimiento} onChange={e => onChange({...data, lugarNacimiento: e.target.value})} required className="h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A]" />
             </div>
             <div className="col-span-2">
                <Label className="text-xs font-bold text-[#4A3728] ml-1">Género *</Label>
                <select value={data.genero} onChange={e => onChange({...data, genero: e.target.value})} required className="w-full h-11 px-3 py-2 rounded-xl border border-[#E8C99A] bg-[#FEFAE0]/30 outline-none text-sm">
                  <option value="">Seleccionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
             </div>
             <div className="col-span-2">
                <Label className="text-xs font-bold text-[#4A3728] ml-1">Dirección *</Label>
                <Input value={data.direccion} onChange={e => onChange({...data, direccion: e.target.value})} required className="h-11 rounded-xl bg-[#FEFAE0]/30 border-[#E8C99A]" />
             </div>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <Button type="submit" className="w-full h-12 bg-[#4A3728] text-white rounded-2xl shadow-xl shadow-[#4A3728]/20">
               <Save className="w-4 h-4 mr-2" /> Guardar y Activar Cuenta
            </Button>
            <button type="button" onClick={onLogout} className="text-xs text-gray-400 hover:text-[#4A3728] transition-colors underline font-medium">
               Cerrar sesión y completar más tarde
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
