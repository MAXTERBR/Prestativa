import React, { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { initAuth, googleSignIn, logout, getAccessToken } from "../lib/firebase";
import { MessageSquare, LogOut, CheckCircle2, Loader2, Send, History } from "lucide-react";
import { ChatShareHistory } from "../types";

export default function GoogleChatIntegration() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState("");
  const [history, setHistory] = useState<ChatShareHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setNeedsAuth(false);
        fetchHistory();
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/chat-history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.sort((a: ChatShareHistory, b: ChatShareHistory) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()));
      }
    } catch (err) {
      console.error("Erro ao puxar histórico de chats:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setMessage("Erro ao fazer login com o Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setMessage(null);
  };

  const testChatNotification = async () => {
    if (!spaceName.trim()) {
      setMessage("Por favor, insira o nome do espaço (ex: spaces/AAA...).");
      return;
    }

    setIsSending(true);
    setMessage(null);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "🚀 Teste de integração do sistema de Suporte de Tickets via Google Chat API concluído com sucesso!",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Erro ${res.status}: ${errData.error?.message || "Falha ao enviar."}`);
      }

      setMessage("Mensagem enviada com sucesso para o canal do Google Chat!");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Erro ao enviar mensagem para o Google Chat.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in text-left">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1 px-1.5 bg-green-100 rounded-lg text-green-700 font-bold text-[10px]">INTEGRAÇÃO</span>
          <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Notificações no Google Chat</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Conecte sua conta do Google Workspace para enviar notificações dinâmicas para canais específicos no Google Chat sobre novos tickets, SLA estourado ou atualizações críticas.
        </p>
      </div>

      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-5">
        {needsAuth ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <MessageSquare className="w-10 h-10 text-slate-300" />
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Conectar Google Chat</h4>
              <p className="text-xs text-slate-500">Faça login com sua conta Google para autorizar o acesso.</p>
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button !mt-4 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded flex items-center px-4 py-2 transition"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-3" />
              ) : (
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-3" style={{ display: "block" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              )}
              <span className="font-medium text-slate-700 text-sm">Sign in with Google</span>
            </button>
            {message && <p className="text-xs text-rose-500 font-medium">{message}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-3xs overflow-hidden border border-emerald-100">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {user?.displayName || "Usuário Conectado"}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </h4>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Desconectar
              </button>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-800">Testar Conexão de Notificação</h5>
              
              <div className="space-y-3 p-4 border border-slate-100 bg-slate-50 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ID do Espaço (Space Name)</label>
                  <input
                    type="text"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    placeholder="Ex: spaces/AAAA1234567"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">O ID do espaço pode ser extraído da URL do Google Chat.</p>
                </div>

                <button
                  onClick={testChatNotification}
                  disabled={isSending || !spaceName.trim()}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 cursor-pointer shadow-3xs ${
                    isSending || !spaceName.trim()
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 border border-green-600"
                  }`}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Disparar Mensagem de Teste
                </button>
              </div>

              {message && (
                <div className={`p-3 text-xs font-medium rounded-lg border ${
                  message.includes("sucesso") 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {message}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-slate-500" />
                <h5 className="text-xs font-bold text-slate-800">Histórico de Compartilhamentos</h5>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-500 font-medium">Nenhum chamado foi compartilhado no Chat ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data / Hora</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ticket</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Atendente</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Espaço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs font-medium text-slate-800">
                              {new Date(item.sharedAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.sharedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold font-mono text-slate-600 border border-slate-200 mb-1">
                              {item.ticketId}
                            </span>
                            <div className="text-xs text-slate-700 truncate max-w-[200px]" title={item.ticketTitle}>
                              {item.ticketTitle}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium text-slate-800">{item.agentName}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.agentEmail}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 inline-block overflow-hidden truncate max-w-[120px]" title={item.spaceName}>
                              {item.spaceName || "-"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
