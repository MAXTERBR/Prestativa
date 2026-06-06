import React, { useState } from "react";
import { KeyRound, Mail, AlertCircle, ShieldAlert, Loader2, UserCheck, Key, HelpCircle } from "lucide-react";

interface SupportLoginProps {
  onLoginSuccess: (user: { name: string; email: string; profile: string; company?: string }) => void;
}

export default function SupportLogin({ onLoginSuccess }: SupportLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simple state to check if email typed is likely to need a password or is a client
  const isClientEmail = email.toLowerCase().includes("@exemplo.com") || email.toLowerCase().includes("@gmail.com");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, preencha o e-mail cadastrado.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/unified-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password || "" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao conectar com servidor de autenticação.");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Falha ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Banner / Header */}
      <div className="bg-slate-900 px-6 py-6 text-white text-center flex flex-col items-center justify-center">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-md mb-2.5">
          <Key className="w-6 h-6 text-white" />
        </div>
        <h2 id="login-title" className="text-xl font-extrabold tracking-tight">Suporte Prestativa</h2>
        <p className="text-xs text-slate-400 mt-1">Identificação unificada de Clientes e Analistas</p>
      </div>

      <div className="p-6 space-y-5">
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Seu E-mail</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                disabled={isLoading}
                placeholder="Ex henrique@empresa.com ou mariana.silva@exemplo.com"
                className="w-full pl-9 pr-4 py-2 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Insira seu e-mail de cadastro.</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Senha de Acesso {isClientEmail && "(Opcional)"}
              </label>
              {isClientEmail && (
                <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-semibold">
                  Perfil Cliente
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                disabled={isLoading}
                placeholder={isClientEmail ? "Deixe em branco (não exige senha)" : "Sua senha de analista"}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 bg-slate-50 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all font-medium disabled:opacity-85"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isClientEmail 
                ? "Clientes cadastrados acessam sem senha." 
                : "A senha é obrigatória para analistas e administradores corporativos."}
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Acessar Sistema"
              )}
            </button>
          </div>
        </form>

        {/* Quick Test Accounts card for convenient evaluation */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Perfis Disponíveis de Demonstração:</h4>
          </div>
          
          <div className="space-y-2">
            {/* Clientes */}
            <div>
              <span className="text-[9px] font-bold text-slate-400 block mb-1">Área do Cliente (Sem senha):</span>
              <button
                type="button"
                onClick={() => handleQuickFill("mariana.silva@exemplo.com", "")}
                className="w-full p-2 border border-slate-200 hover:border-blue-500 text-slate-700 font-medium rounded-lg text-left bg-white transition cursor-pointer text-[11px] flex justify-between items-center group mb-1"
                title="Preencher Mariana"
              >
                <div>
                  <span className="font-bold">🧑‍💼 Mariana Silva</span>
                  <span className="block text-[9px] text-slate-400 font-mono">mariana.silva@exemplo.com</span>
                </div>
                <span className="text-[9px] text-blue-600 font-bold group-hover:underline">Cliente</span>
              </button>
            </div>

            {/* Agentes */}
            <div>
              <span className="text-[9px] font-bold text-slate-400 block mb-1">Painel Técnico / Administrativo (Senha: suporte123):</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("lucas.souza@suporte.com", "suporte123")}
                  className="p-2 border border-slate-200 hover:border-blue-500 text-slate-700 font-medium rounded-lg text-left bg-white transition cursor-pointer text-[11px] truncate"
                  title="Acessar com Lucas Souza"
                >
                  🧔 Lucas Souza
                  <span className="block text-[8px] text-slate-400 font-mono truncate">lucas@suporte.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("aline.santos@suporte.com", "suporte123")}
                  className="p-2 border border-slate-200 hover:border-blue-500 text-slate-700 font-medium rounded-lg text-left bg-white transition cursor-pointer text-[11px] truncate"
                  title="Acessar com Aline Santos"
                >
                  👩 Aline Santos
                  <span className="block text-[8px] text-slate-400 font-mono truncate">aline@suporte.com</span>
                </button>
              </div>
            </div>

            {/* Admin Master */}
            <div>
              <span className="text-[9px] font-bold text-slate-400 block mb-1">Administrador Master (Senha: Sen135h@):</span>
              <button
                type="button"
                onClick={() => handleQuickFill("suporte@prestativaautomacao.com.br", "Sen135h@")}
                className="w-full p-2 border border-slate-200 hover:border-blue-500 text-slate-700 font-medium rounded-lg text-left bg-white transition cursor-pointer text-[11px] flex justify-between items-center group"
                title="Acessar como Administrador Master"
              >
                <div>
                  <span className="font-bold">🔧 Suporte Master</span>
                  <span className="block text-[9px] text-slate-400 font-mono">suporte@prestativaautomacao.com.br</span>
                </div>
                <span className="text-[9px] text-amber-600 font-bold group-hover:underline">Master</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-amber-50 rounded-lg p-2 border border-amber-200/50 text-[10px] text-amber-800">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Estes perfis simulam acessos para os diferentes níveis de permissão.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
