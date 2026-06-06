import React, { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { initAuth, googleSignIn, logout, getAccessToken } from "../lib/firebase";
import { HardDrive, LogOut, CheckCircle2, Loader2, Save, User as UserIcon } from "lucide-react";
import { Ticket } from "../types";

interface GoogleDriveIntegrationProps {
  tickets: Ticket[];
}

export default function GoogleDriveIntegration({ tickets }: GoogleDriveIntegrationProps) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setExportMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setExportMessage("Erro ao fazer login com o Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setExportMessage(null);
  };

  const exportToDrive = async () => {
    setIsExporting(true);
    setExportMessage(null);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const backupData = JSON.stringify(tickets, null, 2);
      const metadata = {
        name: `SuportePrestativa_Backup_${new Date().toISOString().split("T")[0]}.json`,
        mimeType: "application/json",
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([backupData], { type: "application/json" }));

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!res.ok) {
        throw new Error("Erro ao enviar arquivo para o Google Drive.");
      }

      setExportMessage("Backup exportado com sucesso para o seu Google Drive!");
    } catch (err: any) {
      console.error(err);
      setExportMessage(err.message || "Erro ao exportar backup.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in text-left">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1 px-1.5 bg-blue-100 rounded-lg text-blue-600 font-bold text-[10px]">INTEGRAÇÃO</span>
          <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Backup no Google Drive</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Conecte sua conta do Google Workspace para realizar backups da base de tickets diretamente no seu Google Drive, garantindo a segurança dos dados de atendimento.
        </p>
      </div>

      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-5">
        {needsAuth ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <HardDrive className="w-10 h-10 text-slate-300" />
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Conectar Google Drive</h4>
              <p className="text-xs text-slate-500">Faça login com sua conta Google para autorizar o backup.</p>
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
            {exportMessage && <p className="text-xs text-rose-500 font-medium">{exportMessage}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-3xs overflow-hidden border border-emerald-100">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-emerald-600" />
                  )}
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

            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-800">Ações de Backup</h5>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToDrive}
                  disabled={isExporting || tickets.length === 0}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-3xs ${
                    isExporting || tickets.length === 0
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  }`}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Exportar {tickets.length} Tickets para o Drive
                </button>
              </div>
              
              {exportMessage && (
                <div className={`p-3 text-xs font-medium rounded-lg border ${
                  exportMessage.includes("sucesso") 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {exportMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
