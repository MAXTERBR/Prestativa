/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Ticket, TicketStats, TicketCategory, TicketStatus } from "./types";
import DashboardStats from "./components/DashboardStats";
import TicketList from "./components/TicketList";
import TicketDetails from "./components/TicketDetails";
import SupportLogin from "./components/SupportLogin";
import EmailOutboxMonitor from "./components/EmailOutboxMonitor";
import TicketForm from "./components/TicketForm";
import TicketKanban from "./components/TicketKanban";
import { 
  LifeBuoy, 
  User, 
  ShieldCheck, 
  PlusCircle, 
  ListTodo, 
  Search, 
  FolderLock, 
  RefreshCw, 
  Mail,
  Loader2,
  Database,
  LogOut,
  Users,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  LayoutDashboard,
  AlertTriangle,
  HardDrive,
  MessageSquare
} from "lucide-react";
import AccessRegistration from "./components/AccessRegistration";
import ProfilePermissionsConfig from "./components/ProfilePermissionsConfig";
import GoogleDriveIntegration from "./components/GoogleDriveIntegration";
import GoogleChatIntegration from "./components/GoogleChatIntegration";

export default function App() {
  const [session, setSession] = useState<{ name: string; email: string; profile: string; company?: string } | null>(() => {
    try {
      const savedUser = localStorage.getItem("userSession");
      if (savedUser) return JSON.parse(savedUser);
      
      const savedAgent = localStorage.getItem("agentSession");
      if (savedAgent) {
        const parsed = JSON.parse(savedAgent);
        return { name: parsed.name, email: parsed.email, profile: parsed.email === "suporte@prestativaautomacao.com.br" ? "administrador" : "tecnico" };
      }
      
      const savedCustomer = localStorage.getItem("customerSession");
      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer);
        return { name: parsed.name, email: parsed.email, profile: "cliente" };
      }
      
      return null;
    } catch {
      return null;
    }
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mode, setMode] = useState<"customer" | "agent">("customer");
  const [agentSession, setAgentSession] = useState<{ name: string; email: string; company?: string } | null>(null);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0, open: 0, inProgress: 0, solved: 0, closed: 0,
    byCategory: { technical: 0, billing: 0, question: 0, feature: 0, other: 0 },
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 }
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [agentTab, setAgentTab] = useState<"metrics" | "tickets" | "emails" | "acessos" | "permissoes" | "configuracao">("metrics");
  const [configSubTab, setConfigSubTab] = useState<"emails" | "permissoes" | "sla" | "drive" | "chat" | "futuras">("emails");

  const [slaEnabled, setSlaEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("slaEnabled");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [slaLimitHours, setSlaLimitHours] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("slaLimitHours");
      return saved !== null ? parseInt(saved, 10) : 24;
    } catch {
      return 24;
    }
  });

  // Effects to save changes in localStorage
  useEffect(() => {
    try {
      localStorage.setItem("slaEnabled", String(slaEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [slaEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("slaLimitHours", String(slaLimitHours));
    } catch (e) {
      console.error(e);
    }
  }, [slaLimitHours]);

  // Controlled filters for support dashboard interactivity
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<TicketCategory | "all">("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<TicketStatus | "all">("all");
  const [activeClientFilter, setActiveClientFilter] = useState<string | "all">("all");
  const [activeCompanyFilter, setActiveCompanyFilter] = useState<string | "all">("all");

  // App views inside modes
  const [customerSession, setCustomerSession] = useState<{ name: string; email: string; company?: string } | null>(null);

  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isCreatingDirectTicket, setIsCreatingDirectTicket] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNameInput, setCustomerNameInput] = useState("");

  // Client authentication state
  const [clientLoginEmail, setClientLoginEmail] = useState("");
  const [clientLoginError, setClientLoginError] = useState<string | null>(null);
  const [isLoggingInClient, setIsLoggingInClient] = useState(false);

  // Synchronization effect between unified session and legacy session variables for compatibility
  useEffect(() => {
    if (session) {
      localStorage.setItem("userSession", JSON.stringify(session));
      if (session.profile === "cliente") {
        setMode("customer");
        setCustomerSession({ name: session.name, email: session.email, company: session.company });
        localStorage.setItem("customerSession", JSON.stringify({ name: session.name, email: session.email, company: session.company }));
        setAgentSession(null);
        localStorage.removeItem("agentSession");
      } else {
        setMode("agent");
        setAgentSession({ name: session.name, email: session.email, company: session.company });
        localStorage.setItem("agentSession", JSON.stringify({ name: session.name, email: session.email, company: session.company }));
        setCustomerSession(null);
        localStorage.removeItem("customerSession");
      }
    } else {
      localStorage.removeItem("userSession");
      localStorage.removeItem("customerSession");
      localStorage.removeItem("agentSession");
      setCustomerSession(null);
      setAgentSession(null);
    }
  }, [session]);
  
  useEffect(() => {
    if (customerSession) {
      setCustomerEmail(customerSession.email);
      setCustomerNameInput(customerSession.name);
    } else {
      setCustomerEmail("");
      setCustomerNameInput("");
      setTickets([]);
      setSelectedTicket(null);
    }
  }, [customerSession]);

  // API search/loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync / pull data in regular periods
  useEffect(() => {
    fetchData();
  }, [mode, customerEmail]);

  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [companyContacts, setCompanyContacts] = useState<Record<string, {name: string, email: string}[]>>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch tickets based on roles
      let url = "/api/tickets";
      if (mode === "customer" && customerEmail.trim()) {
        url += `?email=${encodeURIComponent(customerEmail.trim())}`;
      }
      const ticketsResponse = await fetch(url);
      if (ticketsResponse.ok) {
        const ticketList = await ticketsResponse.json();
        setTickets(ticketList);
        
        // Preserve selected ticket view updates if currently active
        if (selectedTicket) {
          const updatedSelected = ticketList.find((t: Ticket) => t.id === selectedTicket.id);
          if (updatedSelected) {
            setSelectedTicket(updatedSelected);
          }
        }
      }

      // 2. Fetch statistics aggregated
      const statsResponse = await fetch("/api/stats");
      if (statsResponse.ok) {
        const statistics = await statsResponse.json();
        setStats(statistics);
      }

      // 3. Fetch companies
      try {
        let compUrl = "/api/companies";
        if (mode === "customer" && customerEmail.trim()) {
          compUrl += `?email=${encodeURIComponent(customerEmail.trim())}`;
        }
        const compResponse = await fetch(compUrl);
        if (compResponse.ok) {
          const { companies, companyContacts } = await compResponse.json();
          setAvailableCompanies(companies || []);
          setCompanyContacts(companyContacts || {});
        }
      } catch (err) {
        // ignore
      }
    } catch (err) {
      console.error("Erro de sincronização com a base de dados central.", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Callback on Success of Creation
  const handleTicketCreated = (newTicket: Ticket) => {
    // If client created the ticket, automatically sign them in as customer
    if (mode === "customer") {
      const uSession = { name: newTicket.customerName, email: newTicket.customerEmail, profile: "cliente" };
      setSession(uSession);
    }
    // Refresh database
    fetchData();
    setIsCreatingTicket(false);
  };

  // Callback on State modification inside detail
  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setSelectedTicket(updatedTicket);
    fetchData(); // pull list updates
  };

  // Callback on Deletion
  const handleTicketDeleted = (ticketId: string) => {
    setSelectedTicket(null);
    fetchData();
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientLoginEmail.trim()) {
      setClientLoginError("Por favor, informe seu e-mail.");
      return;
    }
    setClientLoginError(null);
    setIsLoggingInClient(true);
    try {
      const response = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clientLoginEmail.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCustomerSession(data.client);
        localStorage.setItem("customerSession", JSON.stringify(data.client));
        setClientLoginEmail("");
      } else {
        setClientLoginError(data.error || "Acesso de cliente não localizado.");
      }
    } catch (err: any) {
      setClientLoginError("Erro na comunicação com o servidor de suporte.");
    } finally {
      setIsLoggingInClient(false);
    }
  };

  const handleQuickClientLogin = async (email: string) => {
    setClientLoginError(null);
    setIsLoggingInClient(true);
    try {
      const response = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCustomerSession(data.client);
        localStorage.setItem("customerSession", JSON.stringify(data.client));
      } else {
        setClientLoginError(data.error || "Acesso de cliente não localizado.");
      }
    } catch (err: any) {
      setClientLoginError("Falha ao comunicar com servidor.");
    } finally {
      setIsLoggingInClient(false);
    }
  };

  const handleCustomerLogout = () => {
    setCustomerSession(null);
    localStorage.removeItem("customerSession");
  };

  if (!session) {
    return (
      <div id="login-container" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <SupportLogin onLoginSuccess={(u) => setSession(u)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Dynamic Header Navbar - Suporte Prestativa */}
      <header className="bg-white border-b border-slate-200 shadow-2xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* Logo e Nome da Aplicação */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-xs shrink-0">
                <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="truncate">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                  <span className="truncate">Suporte Prestativa</span>
                  <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 border border-blue-100 hidden sm:inline-block">
                    PRO
                  </span>
                </h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">Módulo de Atendimento</p>
              </div>
            </div>

            {/* Controle de Modo do Perfil Logado ou Deslogar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botão Sincronizar */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                title="Sincronizar Banco de Dados"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? "animate-spin text-blue-600" : ""}`} />
              </button>

              {/* Botão do Perfil do Usuário com Dropdown */}
              <div className="relative">
                <button
                  id="profile-dropdown-btn"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer max-w-[145px] sm:max-w-none"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {session.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate hidden xs:inline-block font-sans">{session.name.split(" ")[0]}</span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-sm uppercase tracking-wider scale-90 shrink-0 font-extrabold font-sans">
                    {session.profile === "cliente" ? "Cliente" : session.profile === "administrador" ? "Admin" : "Téc"}
                  </span>
                </button>

                {showProfileDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                      <div className="border-b border-slate-100 pb-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Perfil Autenticado</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-1">{session.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{session.email}</p>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between items-center bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-500">Nível:</span>
                          <span className="font-bold text-slate-800 capitalize">{session.profile}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-500">Status:</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1 leading-none">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Conectado
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSession(null);
                          setShowProfileDropdown(false);
                        }}
                        className="w-full py-2 bg-red-50 text-red-655 hover:bg-red-100 hover:text-red-750 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-red-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Deslogar Usuário
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* MODO CLIENTE (Customer UI Interface) */}
        {mode === "customer" && (
          <div className="space-y-6">
            
            {/* Banner Informativo de Canal de WhatsApp */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl text-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Suporte e Atendimento ao Cliente</h2>
                <p className="text-xs sm:text-sm text-blue-100">
                  Para simplificar e agilizar seu atendimento, você pode consultar seus chamados ativos ou abrir um novo chamado utilizando nossa plataforma online.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setIsCreatingTicket(true);
                    setSelectedTicket(null);
                  }}
                  className="px-5 py-2.5 bg-white text-blue-800 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-blue-100"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  Abrir Novo Chamado
                </button>
                {isCreatingTicket && (
                  <button
                    onClick={() => setIsCreatingTicket(false)}
                    className="px-5 py-2.5 bg-blue-900/50 hover:bg-blue-900 text-white font-semibold text-sm rounded-xl transition-all border border-blue-500/30 cursor-pointer"
                  >
                    Voltar para Consulta
                  </button>
                )}
              </div>
            </div>

            {/* Renderização de Criação vs Consulta */}
            {isCreatingTicket ? (
              <div className="space-y-4">
                <button
                  onClick={() => setIsCreatingTicket(false)}
                  className="text-sm font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Voltar para ver meus chamados
                </button>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <TicketForm 
                    onSuccess={(newTicket) => {
                      setTickets([newTicket, ...tickets]);
                      setSelectedTicket(newTicket);
                      setIsCreatingTicket(false);
                      setCustomerSession({ 
                        name: newTicket.customerName, 
                        email: newTicket.customerEmail,
                        company: newTicket.company 
                      });
                      localStorage.setItem("customerSession", JSON.stringify({ 
                        name: newTicket.customerName, 
                        email: newTicket.customerEmail,
                        company: newTicket.company 
                      }));
                    }}
                    defaultEmail={customerSession?.email || ""}
                    defaultName={customerSession?.name || ""}
                    defaultCompany={customerSession?.company || ""}
                    isAdminOrAgent={false}
                    availableCompanies={availableCompanies}
                    companyContacts={companyContacts}
                  />
                </div>
              </div>
            ) : customerSession === null ? (
              <div className="max-w-md mx-auto bg-white border border-slate-205 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="border-b border-slate-100 pb-4 text-center">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600 mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Área do Cliente</h3>
                  <p className="text-xs text-slate-400 mt-1">Apenas clientes com acesso cadastrado. Não exige senha, apenas o e-mail cadastrado.</p>
                </div>

                {clientLoginError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-left">{clientLoginError}</span>
                  </div>
                )}

                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Seu E-mail de Suporte</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        disabled={isLoggingInClient}
                        placeholder="Ex: mariana.silva@exemplo.com"
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all"
                        value={clientLoginEmail}
                        onChange={(e) => setClientLoginEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingInClient}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isLoggingInClient ? "Iniciando sessão..." : "Acessar Meus Chamados"}
                  </button>
                </form>

                {/* Dica / Auxílio */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs space-y-2.5 text-left">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="text-blue-500">💡</span> Não possui cadastro ainda?
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Clique no botão <b>"Abrir Novo Chamado"</b> acima para abrir seu primeiro chamado. O sistema criará seu cadastro de cliente na mesma hora e fará seu logon automático!
                  </p>
                  
                  <div className="border-t border-slate-200/50 pt-3 space-y-1.5">
                    <p className="text-[10px] text-slate-400 italic">Cliente de demonstração cadastrado no banco:</p>
                    <button
                      type="button"
                      onClick={() => handleQuickClientLogin("mariana.silva@exemplo.com")}
                      className="w-full p-2.5 border border-slate-200 hover:border-blue-500 bg-white text-left rounded-xl transition cursor-pointer text-xs flex justify-between items-center group"
                    >
                      <div>
                        <span className="font-bold text-slate-700 block">👩 Mariana Silva</span>
                        <span className="text-[10px] text-slate-400 block font-mono">mariana.silva@exemplo.com</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-sm font-semibold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700">
                        Autocompletar
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Header Superior do Painel do Cliente */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 font-bold flex items-center justify-center text-blue-600 text-sm shrink-0">
                      {customerSession.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800">👤 {customerSession.name}</h3>
                        <span className="inline-block bg-blue-50 text-blue-700 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm">
                          Sessão Ativa
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{customerSession.email} • Cadastro de Cliente</p>
                    </div>
                  </div>

                  {/* Ações Rápidas de Navegação e Envio */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isCreatingDirectTicket && !selectedTicket && (
                      <button
                        onClick={() => {
                          setIsCreatingDirectTicket(true);
                          setSelectedTicket(null);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <PlusCircle className="w-4 h-4 text-white" />
                        Abrir Chamado Direto
                      </button>
                    )}

                    <button
                      onClick={handleCustomerLogout}
                      className="px-3.5 py-2 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sair do Painel
                    </button>
                  </div>
                </div>

                {/* Área de Visualização Principal do Cliente */}
                {isCreatingDirectTicket ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setIsCreatingDirectTicket(false)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors w-max"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar para o Quadro Kanban
                    </button>
                    <TicketForm 
                      onSuccess={(newTicket) => {
                        setTickets([newTicket, ...tickets]);
                        setSelectedTicket(newTicket);
                        setIsCreatingDirectTicket(false);
                      }}
                      defaultEmail={customerSession.email}
                      defaultName={customerSession.name}
                      defaultCompany={customerSession.company || ""}
                      isAdminOrAgent={false}
                      availableCompanies={availableCompanies}
                      companyContacts={companyContacts}
                    />
                  </div>
                ) : selectedTicket ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors w-max"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar para o Quadro Kanban
                    </button>
                    <div className="max-w-5xl mx-auto">
                      <TicketDetails 
                        ticket={selectedTicket} 
                        mode="customer"
                        onUpdateTicket={handleTicketUpdated}
                        onDeleteTicket={handleTicketDeleted}
                        onBackToList={() => setSelectedTicket(null)}
                        agentEmail={customerSession?.email}
                      />
                    </div>
                  </div>
                ) : (
                  <TicketKanban
                    tickets={tickets.filter(t => t.customerEmail.toLowerCase() === customerSession.email.toLowerCase())}
                    onSelectTicket={(t) => setSelectedTicket(t)}
                    selectedTicketId={selectedTicket?.id}
                    availableCompanies={availableCompanies}
                  />
                )}

              </div>
            )}

          </div>
        )}

        {/* MODO ATENDENTE (Agent Dashboard UI System) */}
        {mode === "agent" && agentSession && (
          <div className="space-y-6">
              
              {/* Seção Superior Compacta: Atendente Logado & Menus de Ação */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                {/* Left Part: Compact analyst profile info */}
                <div className="flex items-center gap-2">
                  <div className="w-8.5 h-8.5 rounded-full bg-blue-50 border border-blue-200 font-bold flex items-center justify-center text-blue-600 text-xs shrink-0">
                    {agentSession.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">👤 {agentSession.name}</span>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-xs uppercase">
                        Equipe de Suporte
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{agentSession.email}</p>
                  </div>
                </div>

                {/* Right Part: Direct Compact Buttons Navigation */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setIsCreatingDirectTicket(true);
                      setAgentTab("tickets");
                      setSelectedTicket(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      isCreatingDirectTicket
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-3xs"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Novo Chamado</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreatingDirectTicket(false);
                      setAgentTab("metrics");
                      setSelectedTicket(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      agentTab === "metrics"
                        ? "bg-slate-900 text-white border-slate-900 shadow-3xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Painel Indicadores</span>
                  </button>

                  <button
                    onClick={() => setAgentTab("tickets")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      agentTab === "tickets"
                        ? "bg-blue-600 text-white border-blue-600 shadow-3xs"
                        : "bg-slate-55 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Fila Geral</span>
                  </button>

                  <button
                    onClick={() => setAgentTab("acessos")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      agentTab === "acessos"
                        ? "bg-indigo-650 text-white border-indigo-650 shadow-3xs"
                        : "bg-slate-55 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Cadastros</span>
                  </button>

                  <button
                    onClick={() => setAgentTab("configuracao")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      agentTab === "configuracao"
                        ? "bg-slate-950 text-white border-slate-950 shadow-3xs"
                        : "bg-slate-55 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Configuração</span>
                  </button>

                  <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

                  <button
                    onClick={() => {
                      setAgentSession(null);
                      localStorage.removeItem("agentSession");
                      setSession(null);
                    }}
                    className="px-2.5 py-1.5 text-[10px] bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-all font-bold flex items-center gap-1 cursor-pointer"
                    title="Encerrar sessão"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Deslogar</span>
                  </button>
                </div>
              </div>

              {/* Secção Superior: Estatísticas Gerais da Base de Dados (Visível apenas se agentTab for 'metrics') */}
              {agentTab === "metrics" && (
                <>
                  <div className="space-y-1 text-left">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600 animate-pulse" />
                      Métricas Fundamentais de Operação
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Mapeamento em tempo real dos fluxos de atendimento e SLA.</p>
                  </div>

                  <DashboardStats 
                    stats={stats} 
                    tickets={tickets}
                    activeStatus={activeStatusFilter}
                    activeCategory={activeCategoryFilter}
                    activeCompany={activeCompanyFilter}
                    onStatusClick={(status) => {
                      setActiveStatusFilter(status);
                      setAgentTab("tickets");
                    }}
                    onCategoryClick={(category) => {
                      setActiveCategoryFilter(category);
                      setAgentTab("tickets");
                    }}
                    onCompanyClick={(company) => {
                      setActiveCompanyFilter(company);
                      setAgentTab("tickets");
                    }}
                    slaEnabled={slaEnabled}
                    slaLimitHours={slaLimitHours}
                  />
                </>
              )}

              {agentTab === "metrics" ? (
                /* Bloco Informativo de Atalhos Rápidos quando em Modo Métricas */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 text-left">
                  <div 
                    onClick={() => setAgentTab("tickets")}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all hover:border-blue-300 cursor-pointer space-y-2.5 group select-none flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                        <ListTodo className="w-5 h-5 shrink-0" />
                      </div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Fila de Atendimento</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Verifique, organize, trie e interaja diretamente com cada chamado ativo ou encerrado.</p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2">
                      Acessar Fila Geral ➔
                    </span>
                  </div>

                  <div 
                    onClick={() => setAgentTab("acessos")}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all hover:border-indigo-300 cursor-pointer space-y-2.5 group select-none flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5 shrink-0" />
                      </div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Gestão de Acessos</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Cadastre novos clientes ou configure os e-mails e cargos dos atendentes de suporte autorizados.</p>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2">
                      Gerenciar Contatos ➔
                    </span>
                  </div>

                  <div 
                    onClick={() => setAgentTab("configuracao")}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all hover:border-slate-400 cursor-pointer space-y-2.5 group select-none flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform">
                        <RefreshCw className="w-5 h-5 shrink-0 animate-spin-slow" />
                      </div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Geral & Configurações</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Rastreie a caixa de monitoramento de e-mails, edite as permissões mestres e realize integrações.</p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2">
                      Abrir Configurações Geral ➔
                    </span>
                  </div>
                </div>
              ) : agentTab === "tickets" ? (
                /* Secção Inferior: Gerenciamento Integrado */
                <div className="grid md:grid-cols-12 gap-6 pt-2">
                  
                  {/* Diretório de Tickets (Lista e Filtros) */}
                  <div className="md:col-span-12 lg:col-span-5 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-blue-600" />
                        Fila de Triagem de Tickets
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">Total: {tickets.length}</span>
                    </div>
                    
                    <TicketList 
                      tickets={tickets} 
                      mode="agent"
                      onSelectTicket={(t) => setSelectedTicket(t)} 
                      selectedTicketId={selectedTicket?.id}
                      statusFilter={activeStatusFilter}
                      setStatusFilter={setActiveStatusFilter}
                      categoryFilter={activeCategoryFilter}
                      setCategoryFilter={setActiveCategoryFilter}
                      clientFilter={activeClientFilter}
                      setClientFilter={setActiveClientFilter}
                      companyFilter={activeCompanyFilter}
                      setCompanyFilter={setActiveCompanyFilter}
                      availableCompanies={availableCompanies}
                    />
                  </div>

                  {/* Detalhes de Atendimento Ativo ou Abertura de Novo Chamado */}
                  <div className="md:col-span-12 lg:col-span-7">
                    {isCreatingDirectTicket ? (
                      <div className="space-y-4">
                        <TicketForm 
                          onSuccess={(newTicket) => {
                            setTickets([newTicket, ...tickets]);
                            setSelectedTicket(newTicket);
                            setIsCreatingDirectTicket(false);
                          }}
                          defaultName=""
                          defaultEmail=""
                          isAdminOrAgent={true}
                          availableCompanies={availableCompanies}
                          companyContacts={companyContacts}
                        />
                      </div>
                    ) : selectedTicket ? (
                      <TicketDetails 
                        ticket={selectedTicket} 
                        mode="agent"
                        onUpdateTicket={handleTicketUpdated}
                        onDeleteTicket={handleTicketDeleted}
                        onBackToList={() => setSelectedTicket(null)}
                      />
                    ) : (
                      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center flex flex-col justify-center items-center min-h-[450px]">
                        <FolderLock className="w-12 h-12 text-slate-300 mb-3" />
                        <h4 className="font-bold text-slate-700 text-sm">Fila de Atendimento Inativa</h4>
                        <p className="text-xs text-slate-400 max-w-sm mt-1">
                          Selecione um chamado correspondente na fila de triagem lateral ou crie um "Novo Chamado" na barra de menu.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              ) : agentTab === "emails" ? (
                <EmailOutboxMonitor currentAgentEmail={agentSession?.email || ""} />
              ) : agentTab === "acessos" ? (
                <AccessRegistration currentAgentEmail={agentSession?.email || ""} />
              ) : agentTab === "configuracao" ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-left">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">⚙️ Painel de Configurações Geral</h2>
                    <p className="text-xs text-slate-400">Configure integrações, permissões master e monitoramento de e-mails em tempo real.</p>
                  </div>

                  {/* Sub Tabs menu */}
                  <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2">
                    <button
                      onClick={() => setConfigSubTab("emails")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        configSubTab === "emails"
                          ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Monitor de E-mails</span>
                    </button>

                    <button
                      onClick={() => setConfigSubTab("permissoes")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        configSubTab === "permissoes"
                          ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <FolderLock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Permissões de Perfis (Master)</span>
                    </button>

                    <button
                      onClick={() => setConfigSubTab("sla")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        configSubTab === "sla"
                          ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>Alertas de SLA</span>
                    </button>

                    <button
                      onClick={() => setConfigSubTab("drive")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        configSubTab === "drive"
                          ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                      <span>Google Drive</span>
                    </button>

                    <button
                      onClick={() => setConfigSubTab("chat")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        configSubTab === "chat"
                          ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                      <span>Google Chat</span>
                    </button>

                    <button
                      onClick={() => setConfigSubTab("futuras")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        configSubTab === "futuras"
                          ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span>Abas Futuras</span>
                    </button>
                  </div>

                  {/* Render configurations modules based on selected sub tab */}
                  {configSubTab === "emails" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50/50 border border-blue-105 rounded-xl text-[11px] text-blue-800 leading-relaxed">
                        ✉️ O <b>Monitor de E-mails</b> intercepta as saídas automáticas de e-mail enviadas aos clientes para rastreabilidade de SLA estrutural.
                      </div>
                      <EmailOutboxMonitor currentAgentEmail={agentSession?.email || ""} />
                    </div>
                  )}

                  {configSubTab === "permissoes" && (
                    <div className="space-y-2">
                      <ProfilePermissionsConfig currentAgentEmail={agentSession?.email || ""} />
                    </div>
                  )}

                  {configSubTab === "sla" && (
                    <div className="space-y-6 max-w-3xl animate-in fade-in duration-200 text-left">
                      {/* Descritivo de SLA */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-rose-100 rounded-lg text-rose-600 font-bold text-[10px]">POLÍTICA SLA</span>
                          <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Monitoramento de Alerta de Atendimento</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Defina as regras e tolerâncias máximas para chamados operacionais sem resposta. Caso os chamados fiquem intocados além do limite configurado nas situações <b>Aberto</b> ou <b>Triage / Pendente</b>, alertas de criticidade dinâmicos serão anexados diretamente no painel de indicadores gerais.
                        </p>
                      </div>

                      {/* Configurações básicas */}
                      <div className="space-y-4">
                        {/* Ativar/Desativar */}
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Ativar Alertas de SLA Visual</h4>
                            <p className="text-[11px] text-slate-400">Exibir avisos e badge vermelho ao ultrapassar o limite de conformidade.</p>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 scale-95">
                            <input
                              type="checkbox"
                              checked={slaEnabled}
                              onChange={(e) => setSlaEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* Definição de tempo limite em horas */}
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Tempo Limite Sem Atualizações (SLA)</h4>
                            <p className="text-[11px] text-slate-400">Tempo limite tolerado de e-mail ou WhatsApp sem retorno para disparo dos alertas visuais.</p>
                          </div>

                          {/* Quick presets */}
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Atalhos rápidos de conformidade:</span>
                            <div className="flex flex-wrap gap-2">
                              {[12, 18, 24, 36, 48].map((hoursPreset) => {
                                const isPresetActive = slaLimitHours === hoursPreset;
                                return (
                                  <button
                                    key={hoursPreset}
                                    type="button"
                                    onClick={() => setSlaLimitHours(hoursPreset)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                                      isPresetActive
                                        ? "bg-rose-50 border-rose-200 text-rose-700 shadow-3xs"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    {hoursPreset} horas {hoursPreset === 24 && "⏱️ (Padrão)"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Custom input */}
                          <div className="pt-3 flex items-center gap-3 border-t border-slate-100">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajuste manual de horas:</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="720"
                                  value={slaLimitHours}
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10);
                                    if (!isNaN(parsed) && parsed > 0) {
                                      setSlaLimitHours(parsed);
                                    }
                                  }}
                                  className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                                <span className="text-xs text-slate-500 font-medium">horas de tolerância operacional</span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Mockup Preview Area */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-100 inline-block">Visualização Prévia no Painel</span>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 animate-pulse">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-700">Painel com alerta ativo</p>
                              <p className="text-[10px] text-slate-400">Banners de monitoramento e badges com sinal vermelho guiarão o atendimento.</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-2 py-1 rounded-full border bg-red-50 text-red-650 border-red-100 shadow-3xs animate-pulse">
                            ⚠️ Alerta de SLA Ativo
                          </span>
                        </div>
                      </div>

                    </div>
                  )}

                  {configSubTab === "drive" && (
                    <GoogleDriveIntegration tickets={tickets} />
                  )}

                  {configSubTab === "chat" && (
                    <GoogleChatIntegration />
                  )}

                  {configSubTab === "futuras" && (
                    <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 max-w-md mx-auto">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        ⚙️
                      </div>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">Configurações Expandidas</h3>
                      <p className="text-[11px] text-slate-400">Configurações adicionais de webhook, automações de triagem e inteligência artificial de WhatsApp serão parametrizados diretamente nesta seção nas próximas versões.</p>
                    </div>
                  )}
                </div>
              ) : (
                <ProfilePermissionsConfig currentAgentEmail={agentSession?.email || ""} />
              )}

            </div>
        )}

      </main>

      {/* Footer corporativo */}
      <footer className="bg-white border-t border-slate-100 py-4 mt-auto text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>{new Date().getFullYear()} © SuporteCentral de Tickets - Base de Dados Corrente.</span>
          <span className="flex items-center gap-1 text-[11px]">
            🏁 Status Banco: <b className="text-blue-600 font-bold">ONLINE (Persistente)</b>
          </span>
        </div>
      </footer>

    </div>
  );
}
