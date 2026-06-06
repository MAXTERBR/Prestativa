import React, { useEffect, useState } from "react";
import { 
  UserPlus, 
  Users, 
  Trash2, 
  AlertCircle, 
  ShieldCheck, 
  Mail, 
  Key, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Pencil, 
  Phone, 
  Building, 
  Briefcase, 
  X 
} from "lucide-react";

interface Agent {
  name: string;
  email: string;
  profile: "administrador" | "tecnico" | "cliente";
  password?: string;
  phone?: string;
  company?: string;
  role?: string;
}

interface AccessRegistrationProps {
  currentAgentEmail: string;
}

export default function AccessRegistration({ currentAgentEmail }: AccessRegistrationProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<"administrador" | "tecnico" | "cliente">("tecnico");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit Modal States
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editProfile, setEditProfile] = useState<"administrador" | "tecnico" | "cliente">("tecnico");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Custom Delete Confirmation States
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agents", {
        headers: {
          "X-Agent-Email": currentAgentEmail
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao obter lista de acessos.");
      }
    } catch (err: any) {
      console.error("Erro ao buscar usuários de suporte:", err);
      setFeedback({ type: "error", message: err.message || "Você não possui permissão ou ocorreu uma falha de conexão." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFeedback({ type: "error", message: "Nome e e-mail são campos obrigatórios." });
      return;
    }

    if (profile !== "cliente" && !password) {
      setFeedback({ type: "error", message: "A senha é obrigatória para perfis de suporte (Administrador ou Técnico)." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Email": currentAgentEmail
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: profile === "cliente" ? "" : password,
          profile,
          phone: phone.trim(),
          company: company.trim(),
          role: role.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFeedback({ type: "success", message: `Acesso do usuário "${name}" registrado com sucesso!` });
        // Clear fields
        setName("");
        setEmail("");
        setPassword("");
        setProfile("tecnico");
        setPhone("");
        setCompany("");
        setRole("");
        // Reload list
        fetchAgents();
      } else {
        setFeedback({ type: "error", message: data.error || "Falha ao registrar novo login." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Erro de rede ao salvar cadastro." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditName(agent.name || "");
    setEditEmail(agent.email || "");
    setEditPassword(agent.profile === "cliente" ? "" : (agent.password || "••••••••"));
    setEditProfile(agent.profile || "tecnico");
    setEditPhone(agent.phone || "");
    setEditCompany(agent.company || "");
    setEditRole(agent.role || "");
    setEditError(null);
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    if (!editName.trim() || !editEmail.trim()) {
      setEditError("Nome e e-mail são obrigatórios.");
      return;
    }

    if (editProfile !== "cliente" && !editPassword) {
      setEditError("Senha é obrigatória para os perfis de suporte (Administrador ou Técnico).");
      return;
    }

    setIsUpdating(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(editingAgent.email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Email": currentAgentEmail
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          password: editProfile === "cliente" ? "" : editPassword,
          profile: editProfile,
          phone: editPhone.trim(),
          company: editCompany.trim(),
          role: editRole.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFeedback({ type: "success", message: `Informações de "${editName}" atualizadas com sucesso!` });
        setEditingAgent(null);
        fetchAgents();
      } else {
        setEditError(data.error || "Falha ao atualizar usuário.");
      }
    } catch (err: any) {
      setEditError(err.message || "Falha na conexão ao tentar atualizar.");
    } finally {
      setIsUpdating(false);
    }
  };

  const requestDeleteAgent = (agent: Agent) => {
    if (agent.email.toLowerCase() === "suporte@prestativaautomacao.com.br") {
      setFeedback({ type: "error", message: "Não é permitido excluir o usuário Administrador Master." });
      return;
    }
    setAgentToDelete(agent);
  };

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    const emailToDelete = agentToDelete.email;
    const agentName = agentToDelete.name;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(emailToDelete)}`, {
        method: "DELETE",
        headers: {
          "X-Agent-Email": currentAgentEmail
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFeedback({ type: "success", message: `Acesso do usuário "${agentName}" foi revogado com sucesso.` });
        setAgentToDelete(null);
        fetchAgents();
      } else {
        setFeedback({ type: "error", message: data.error || "Não foi possível revogar o acesso." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Erro de rede ao tentar excluir acesso." });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [currentAgentEmail]);

  return (
    <div className="space-y-6 pt-2 animate-in fade-in duration-150">
      
      {/* Title */}
      <div className="text-left">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 opacity-75 text-blue-600" />
          Gerenciamento e Cadastro de Acessos
        </h3>
        <p className="text-xs text-slate-500">Registre novos operadores ou gerencie pessoas habilitadas para interagir com a central de suporte.</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-xs text-left flex justify-between items-start gap-2.5 ${
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
            className="text-slate-400 hover:text-slate-900 text-[10px] uppercase font-bold cursor-pointer inline-block shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Register Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-950 px-5 py-4 text-white flex items-center gap-2 text-left">
              <span className="p-1.5 bg-blue-600/35 border border-blue-500/20 text-blue-400 rounded-lg">
                <UserPlus className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Novo Registro de Usuário</h4>
                <p className="text-[10px] text-slate-400">Preencha os dados e escolha o perfil do usuário</p>
              </div>
            </div>

            <form onSubmit={handleCreateAgent} className="p-5 space-y-4 text-left">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail de Acesso</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@dominio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Celular / WhatsApp</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empresa</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Building className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Nome da empresa"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cargo / Setor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Briefcase className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: Gerente de TI"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil de Usuário</label>
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                >
                  <option value="tecnico">Técnico (Foco em responder chamados e alterar status)</option>
                  <option value="administrador">Administrador (Gestão geral, e-mails e exclusões)</option>
                  <option value="cliente">Cliente (Apenas visualização rápida de tickets vinculados)</option>
                </select>
              </div>

              {profile !== "cliente" ? (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Senha de Suporte</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Key className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Defina uma senha robusta"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-[11px] leading-relaxed animate-in fade-in duration-150">
                  ⚡ <b>Perfil Cliente selecionado:</b> Não é necessária a criação de senha, facilitando o login por e-mail no painel.
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Salvar Cadastro de Usuário
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Active Users Directory Grid */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 text-left flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operadores Habilitados</h4>
                <p className="text-[10px] text-slate-500">Clique em qualquer operador para abrir edição do cadastro</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-200">
                {agents.length} Contas
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-xs">Carregando usuários ativos de suporte...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border-b border-slate-100">
                <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Nenhum operador cadastrado no sistema</p>
                <p className="text-[11px] text-slate-400 mt-1">Crie um usuário no formulário ao lado para liberar acessos.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-4">Operador</th>
                      <th className="p-4">Endereço de E-mail</th>
                      <th className="p-4">Perfil</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agents.map((agent) => {
                      const isMaster = agent.email.toLowerCase() === "suporte@prestativaautomacao.com.br";
                      return (
                        <tr key={agent.email} className="hover:bg-slate-55/75 transition-colors">
                          <td className="p-4 cursor-pointer" onClick={() => startEditAgent(agent)}>
                            <div className="font-semibold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              {agent.name}
                              <Pencil className="w-3 h-3 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-slate-450 space-y-0.5 mt-0.5 max-w-sm">
                              {agent.phone && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded text-[8.5px] mr-1">
                                  📞 {agent.phone}
                                </span>
                              )}
                              {agent.company && (
                                <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[8.5px] mr-1">
                                  🏢 {agent.company}
                                </span>
                              )}
                              {agent.role && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[8.5px]">
                                  💼 {agent.role}
                                </span>
                              )}
                            </div>
                            {isMaster && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-55 border border-amber-205 text-amber-800 font-mono text-[8px] font-bold rounded-sm uppercase tracking-wide">
                                Master Principal
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-500 shrink-0" onClick={() => startEditAgent(agent)}>
                            <span className="cursor-pointer hover:underline">{agent.email}</span>
                          </td>
                          <td className="p-4" onClick={() => startEditAgent(agent)}>
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase cursor-pointer border ${
                              agent.profile === "administrador"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : agent.profile === "tecnico"
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                            }`}>
                              {agent.profile === "administrador" ? "Administrador" : agent.profile === "tecnico" ? "Técnico" : "Cliente"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditAgent(agent)}
                                className="p-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                                title={`Editar operador ${agent.name}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteAgent(agent)}
                                disabled={isMaster}
                                className={`p-1.5 rounded-lg border transition ${
                                  isMaster
                                    ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50"
                                    : "bg-red-50 border-red-100 text-red-600 hover:bg-red-150 hover:text-red-700 cursor-pointer"
                                }`}
                                title={isMaster ? "Impossível remover o usuário mestre principal" : `Excluir operador ${agent.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed text-left">
              💡 <b>Nota de Segurança:</b> Apenas contas com perfil de <b>Administrador</b> ou <b>Técnico</b> (conforme regras em vigor) podem gerenciar acessos de usuários.
            </div>

          </div>
        </div>

      </div>

      {/* Edit Modal Overlay */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="bg-slate-950 px-5 py-4 text-white flex justify-between items-center text-left">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-600/35 border border-blue-500/20 text-blue-400 rounded-lg">
                  <Pencil className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Editar Cadastro de Usuário</h4>
                  <p className="text-[10px] text-slate-450">Modifique as informações de registro cadastradas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAgent} className="p-6 space-y-4 text-left">
              
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded-xl flex items-start gap-2 animate-pulse">
                  <AlertCircle className="w-4.5 h-4.5 text-red-650 shrink-0 mt-0.5" />
                  <span className="font-medium">{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silva"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail de Acesso</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      required
                      disabled={editingAgent.email.toLowerCase() === "suporte@prestativaautomacao.com.br"}
                      placeholder="exemplo@dominio.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Celular / WhatsApp</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empresa</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Building className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Nome da empresa"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cargo / Setor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Briefcase className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: Supervisor"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil de Usuário</label>
                <select
                  value={editProfile}
                  onChange={(e) => setEditProfile(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                >
                  <option value="tecnico">Técnico (Foco em responder chamados e alterar status)</option>
                  <option value="administrador">Administrador (Gestão geral, e-mails e exclusões)</option>
                  <option value="cliente">Cliente (Apenas visualização rápida de tickets vinculados)</option>
                </select>
              </div>

              {editProfile !== "cliente" ? (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alterar Senha de Acesso</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450">
                      <Key className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-[11px] leading-relaxed animate-in fade-in duration-150">
                  ⚡ <b>Perfil Cliente selecionado:</b> Não é necessária a criação ou redefinição de senha para este perfil.
                </div>
              )}

              <div className="pt-4 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-lg transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar Alterações"
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {agentToDelete && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="bg-red-950 px-5 py-4 text-white flex justify-between items-center text-left">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-600/35 border border-red-500/20 text-red-400 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Confirmar Exclusão</h4>
                  <p className="text-[10px] text-red-200 text-left">Esta ação é definitiva e removerá o acesso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAgentToDelete(null)}
                className="text-red-300 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-900 leading-relaxed">
                ⚠️ <b>Atenção:</b> Você está prestes a revogar e excluir definitivamente o cadastro do usuário <b>{agentToDelete.name}</b> (<code>{agentToDelete.email}</code>).
                <p className="mt-2 text-[11px] text-red-700">Ele perderá imediatamente o acesso ao painel de chamados do sistema.</p>
              </div>

              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAgentToDelete(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-lg transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAgent}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-650 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Confirmar Exclusão"
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
