import { useState } from "react";
import { BookOpen, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular envío de código
    setTimeout(() => {
      setLoading(false);
      setStep('code');
      console.log("Código enviado a:", email);
    }, 1500);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus siguiente input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length !== 6) {
      alert("Por favor ingresa el código completo");
      return;
    }

    setLoading(true);
    
    // Simular verificación de código
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      console.log("Código verificado:", fullCode);
    }, 1500);
  };

  const handleResendCode = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Código reenviado a " + email);
    }, 1000);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FEFAE0' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-8 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#4A3728' }}>
              <KeyRound className="w-10 h-10" style={{ color: '#D4A373' }} />
            </div>
            <h1 className="mb-2" style={{ color: '#4A3728' }}>
              {step === 'email' && 'Recuperar Contraseña'}
              {step === 'code' && 'Verificar Código'}
              {step === 'success' && '¡Código Verificado!'}
            </h1>
            <p className="text-sm" style={{ color: '#4A3728', opacity: 0.7 }}>
              {step === 'email' && 'Ingresa tu correo para recibir un código de verificación'}
              {step === 'code' && 'Ingresa el código de 6 dígitos enviado a tu correo'}
              {step === 'success' && 'Tu código ha sido verificado exitosamente'}
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block" style={{ color: '#4A3728' }}>
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#D4A373' }} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none focus:border-opacity-100 transition-all"
                    style={{ 
                      backgroundColor: '#FEFAE0',
                      borderColor: '#D4A373',
                      color: '#4A3728'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
                style={{ 
                  backgroundColor: '#4A3728',
                  color: '#FEFAE0'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar Código de Verificación'}
              </button>

              <Link to="/" className="block">
                <button
                  type="button"
                  className="w-full py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md flex items-center justify-center gap-2"
                  style={{ 
                    borderColor: '#D4A373',
                    color: '#4A3728',
                    backgroundColor: 'transparent'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </button>
              </Link>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-center" style={{ color: '#4A3728' }}>
                  Código enviado a: <span className="font-medium">{email}</span>
                </p>

                {/* Code Input */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-medium rounded-lg border-2 focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: '#FEFAE0',
                        borderColor: digit ? '#606C38' : '#D4A373',
                        color: '#4A3728'
                      }}
                    />
                  ))}
                </div>

                {/* Resend Code */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm hover:underline disabled:opacity-50"
                    style={{ color: '#606C38' }}
                  >
                    ¿No recibiste el código? Reenviar
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.some(d => !d)}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
                style={{ 
                  backgroundColor: '#606C38',
                  color: '#FEFAE0'
                }}
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md flex items-center justify-center gap-2"
                style={{ 
                  borderColor: '#D4A373',
                  color: '#4A3728',
                  backgroundColor: 'transparent'
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar correo electrónico
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#606C38' }}>
                  <svg className="w-10 h-10" style={{ color: '#FEFAE0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm mb-6" style={{ color: '#4A3728' }}>
                  Código verificado correctamente para <br />
                  <span className="font-medium">{email}</span>
                </p>
                <p className="text-xs" style={{ color: '#4A3728', opacity: 0.7 }}>
                  Ahora puedes crear una nueva contraseña para tu cuenta
                </p>
              </div>

              <Link to="/" className="block">
                <button
                  type="button"
                  className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ 
                    backgroundColor: '#606C38',
                    color: '#FEFAE0'
                  }}
                >
                  Continuar para crear nueva contraseña
                </button>
              </Link>

              <Link to="/" className="block">
                <button
                  type="button"
                  className="w-full py-3 rounded-lg font-medium border-2 transition-all hover:shadow-md flex items-center justify-center gap-2"
                  style={{ 
                    borderColor: '#D4A373',
                    color: '#4A3728',
                    backgroundColor: 'transparent'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </button>
              </Link>
            </div>
          )}

          {/* Info Box */}
          {step === 'email' && (
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FEFAE0', border: '1px solid #D4A373' }}>
              <p className="text-xs text-center" style={{ color: '#4A3728', opacity: 0.8 }}>
                📧 Recibirás un código de 6 dígitos en tu correo electrónico. 
                El código expirará en 10 minutos.
              </p>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="mt-4 text-center text-sm" style={{ color: '#4A3728', opacity: 0.7 }}>
          <p>🔒 Tu información está segura con nosotros</p>
        </div>
      </div>
    </div>
  );
}
