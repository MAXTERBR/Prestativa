import React, { useEffect, useState } from "react";
import { FolderLock, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Save, RotateCcw } from "lucide-react";

interface ProfilePermissions {
  view_tickets: boolean;
  respond_tickets: boolean;
  update_tickets: boolean;
  delete_tickets: boolean;
  view_outbox: boolean;
  resend_emails: boolean;
  manage_access: boolean;
}

interface PermissionsConfig {
  administrador: ProfilePermissions;
  tecnico: ProfilePermissions;
  cliente: ProfilePermissions;
}

interface ProfilePermissionsConfigProps {
  currentAgentEmail: string;
}

const MODULE_DEFINITIONS = [
  { key: "view_tickets", label: "Fila de Atendimento (Visualização)", description: "Consultar a lista geral de chamados e históricos de conversas." },
  { key: "respond_tickets", label: "Responder Tickets / Mensagens", description: "Escrever e mandar atualizações ou soluções na timeline do chamado." },
  { key: "update_tickets", label: "Atualizar Dados / Status / Prioridades", description: "Alterar status, escala de SLA de prioridade e atribuir atendentes técnicos." },
  { key: "delete_tickets", label: "Excluir Tickets", description: "Excluir chamados permanentemente do banco de dados (Ação crítica)." },
  { key: "view_outbox", label: "Acessar Monitor de E-mails", description: "Visualizar históricos, auditar relatórios e realizar testes SMTP de diagnóstico." },
  { key: "resend_emails", label: "Reenviar E-mails no Monitor", description: "Disparar reenvios de correspondências e validar entregas SMTP." },
  { key: "manage_access", label: "Acessar Cadastro de Usuários", description: "Habilidade de registrar, visualizar e revogar contas de acessos." },
];

export default function ProfilePermissionsConfig({ currentAgentEmail }: ProfilePermissionsConfigProps) {
  const [permissions, setPermissions] = useState<PermissionsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/permissions", {
        headers: {
          "X-Agent-Email": currentAgentEmail
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Apenas o usuário master do sistema possui acesso a esta configuração.");
      }
    } catch (err: any) {
      console.error("Erro ao buscar configurações de níveis de acesso:", err);
      setFeedback({ type: "error", message: err.message || "Erro de rede ao sincronizar permissões." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (profile: keyof PermissionsConfig, key: keyof ProfilePermissions) => {
    if (!permissions) return;
    
    // Prevent the master user from locking out the 'administrador' from everything or locking themselves out
    if (profile === "administrador" && key === "manage_access") {
      setFeedback({ 
        type: "error", 
        message: "Por segurança técnica, a permissão 'Acessar Cadastro de Usuários' não pode ser revogada do perfil de Administrador." 
      });
      return;
    }

    const updated = {
      ...permissions,
      [profile]: {
        ...permissions[profile],
        [key]: !permissions[profile][key]
      }
    };
    setPermissions(updated);
  };

  const handleSavePermissions = async () => {
    if (!permissions) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Email": currentAgentEmail
        },
        body: JSON.stringify(permissions)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFeedback({ 
          type: "success", 
          message: "Excelente! As diretrizes de privilégios de acessos foram propagadas com sucesso!" 
        });
      } else {
        setFeedback({ type: "error", message: data.error || "Houve uma rejeição técnica ao tentar salvar." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Erro de servidor ao publicar alterações." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!window.confirm("Deseja redefinir os privilégios dos perfis aos padrões iniciais de fábrica?")) {
      return;
    }
    const defaultPerms: PermissionsConfig = {
      administrador: {
        view_tickets: true,
        respond_tickets: true,
        update_tickets: true,
        delete_tickets: true,
        view_outbox: true,
        resend_emails: true,
        manage_access: true
      },
      tecnico: {
        view_tickets: true,
        respond_tickets: true,
        update_tickets: true,
        delete_tickets: false,
        view_outbox: true,
        resend_emails: false,
        manage_access: true
      },
      cliente: {
        view_tickets: true,
        respond_tickets: false,
        update_tickets: false,
        delete_tickets: false,
        view_outbox: false,
        resend_emails: false,
        manage_access: false
      }
    };
    setPermissions(defaultPerms);
    setFeedback({ type: "success", message: "Privilégios resetados na tela. Lembre-se de clicar em salvar para propagar as regras." });
  };

  useEffect(() => {
    fetchPermissions();
  }, [currentAgentEmail]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-xs">Sincronizando privilégios corporativos de segurança...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 animate-in fade-in duration-150">
      
      {/* Title */}
      <div className="text-left flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FolderLock className="w-4 opacity-75 text-amber-600" />
            Configuração de Privacidade e Permissões de Perfis
          </h3>
          <p className="text-xs text-slate-500">Mapeador de segurança reservado exclusivamente para o Proprietário Master. Controle o que cada cargo pode ler, editar ou deletar.</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Padrões
          </button>
          
          <button
            type="button"
            disabled={isSaving || !permissions}
            onClick={handleSavePermissions}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaving ? "Aplicando..." : "Salvar Configuração"}
          </button>
        </div>
      </div>

      {feedback && (
        <div id="permissions-feedback-box" className={`p-4 rounded-xl border text-xs text-left flex justify-between items-start gap-2.5 ${
          feedback.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
            : "bg-red-50 border-red-200 text-red-950"
        }`}>
          <div className="flex gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 text-red-650 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{feedback.type === "success" ? "Operação concluída!" : "Atenção"}</p>
              <p className="text-[11px] leading-relaxed mt-0.5">{feedback.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-slate-900 text-[10px] uppercase font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {permissions && (
        <div id="permissions-matrix-table-card" className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          
          <div className="bg-slate-900 p-5 text-white text-left flex gap-3 items-center border-b border-slate-800">
            <span className="p-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg">
              <FolderLock className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Painel de Privilégios por Função</h4>
              <p className="text-[10px] text-slate-400">Ative ou remova o acesso imediato de cada grupo de usuários do sistema</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-205">
                <tr>
                  <th className="p-4 w-1/3">Direitos de Ação de Sistema</th>
                  
                  {/* Administrador Headers */}
                  <th className="p-4 text-center">
                    <span className="block font-bold text-red-700">🔴 ADMINISTRADOR</span>
                    <span className="block text-[8px] text-slate-400 normal-case font-medium mt-0.5">Operações críticas & fiscais</span>
                  </th>

                  {/* Técnico Headers */}
                  <th className="p-4 text-center">
                    <span className="block font-bold text-indigo-700">🔵 TÉCNICO</span>
                    <span className="block text-[8px] text-slate-400 normal-case font-medium mt-0.5">Atividades de SLA técnico</span>
                  </th>

                  {/* Cliente Headers */}
                  <th className="p-4 text-center">
                    <span className="block font-bold text-emerald-700">🟢 CLIENTE</span>
                    <span className="block text-[8px] text-slate-400 normal-case font-medium mt-0.5">Foco em consulta</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-750">
                {MODULE_DEFINITIONS.map((def) => {
                  const key = def.key as keyof ProfilePermissions;
                  return (
                    <tr key={key} className="hover:bg-slate-50/20 transition-colors">
                      
                      {/* Name and description of features */}
                      <td className="p-4 pr-6">
                        <div className="font-bold text-slate-800 text-[12px]">{def.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">{def.description}</div>
                      </td>

                      {/* Administrador profile column toggle */}
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer relative py-2">
                          <input
                            type="checkbox"
                            checked={permissions.administrador[key]}
                            onChange={() => handleToggle("administrador", key)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-250 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[10px] after:left-[3px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                      </td>

                      {/* Técnico profile column toggle */}
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer relative py-2">
                          <input
                            type="checkbox"
                            checked={permissions.tecnico[key]}
                            onChange={() => handleToggle("tecnico", key)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-250 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[10px] after:left-[3px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </td>

                      {/* Cliente profile column toggle */}
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer relative py-2">
                          <input
                            type="checkbox"
                            checked={permissions.cliente[key]}
                            onChange={() => handleToggle("cliente", key)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-250 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[10px] after:left-[3px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

          <div className="bg-slate-50 px-5 py-4 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500 text-left">
            <span>🔴 <b>Propagação em tempo real:</b> As mudanças modificam a API e passam a vigorar assim que salvar.</span>
            <button
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-755 text-white rounded-lg text-[10px] font-bold shadow-xs transition hover:bg-slate-800 select-none cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3 h-3 text-emerald-400" />
              Publicar Regras no Servidor
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
