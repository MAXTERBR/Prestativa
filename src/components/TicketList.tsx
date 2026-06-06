/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from "../types";
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Tag, 
  AlertCircle,
  FolderLock,
  MessageSquare,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  selectedTicketId?: string | null;
  mode: "customer" | "agent";
  statusFilter?: TicketStatus | "all";
  setStatusFilter?: (v: TicketStatus | "all") => void;
  categoryFilter?: TicketCategory | "all";
  setCategoryFilter?: (v: TicketCategory | "all") => void;
  clientFilter?: string | "all";
  setClientFilter?: (v: string | "all") => void;
  companyFilter?: string | "all";
  setCompanyFilter?: (v: string | "all") => void;
  availableCompanies?: string[];
}

export default function TicketList({ 
  tickets, 
  onSelectTicket, 
  selectedTicketId, 
  mode,
  statusFilter: propStatusFilter,
  setStatusFilter: propSetStatusFilter,
  categoryFilter: propCategoryFilter,
  setCategoryFilter: propSetCategoryFilter,
  clientFilter: propClientFilter,
  setClientFilter: propSetClientFilter,
  companyFilter: propCompanyFilter,
  setCompanyFilter: propSetCompanyFilter,
  availableCompanies = []
}: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
  const [localCategoryFilter, setLocalCategoryFilter] = useState<TicketCategory | "all">("all");
  const [slaFilter, setSlaFilter] = useState<"all" | "ok" | "overdue">("all");
  const [localClientFilter, setLocalClientFilter] = useState<string | "all">("all");
  const [localCompanyFilter, setLocalCompanyFilter] = useState<string | "all">("all");

  const statusFilter = propStatusFilter !== undefined ? propStatusFilter : localStatusFilter;
  const setStatusFilter = propSetStatusFilter !== undefined ? propSetStatusFilter : setLocalStatusFilter;

  const categoryFilter = propCategoryFilter !== undefined ? propCategoryFilter : localCategoryFilter;
  const setCategoryFilter = propSetCategoryFilter !== undefined ? propSetCategoryFilter : setLocalCategoryFilter;

  const clientFilter = propClientFilter !== undefined ? propClientFilter : localClientFilter;
  const setClientFilter = propSetClientFilter !== undefined ? propSetClientFilter : setLocalClientFilter;

  const companyFilter = propCompanyFilter !== undefined ? propCompanyFilter : localCompanyFilter;
  const setCompanyFilter = propSetCompanyFilter !== undefined ? propSetCompanyFilter : setLocalCompanyFilter;

  const getStatusStyle = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-600", label: "Aberto" };
      case "in_progress":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-600", label: "Em Atendimento" };
      case "solved":
        return { bg: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-600", label: "Resolvido" };
      case "closed":
        return { bg: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-600", label: "Fechado" };
    }
  };

  const getPriorityStyle = (priority: TicketPriority) => {
    switch (priority) {
      case "low":
        return { label: "Baixa", badge: "bg-slate-100 text-slate-700", border: 'border-slate-100' };
      case "medium":
        return { label: "Média", badge: "bg-blue-100 text-blue-700", border: 'border-blue-100' };
      case "high":
        return { label: "Alta", badge: "bg-orange-150 text-orange-700", border: 'border-orange-200' };
      case "urgent":
        return { label: "Urgente", badge: "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse", border: 'border-rose-300' };
    }
  };

  const getCategoryLabel = (category: TicketCategory) => {
    switch (category) {
      case "technical":
        return "Técnico";
      case "billing":
        return "Financeiro";
      case "question":
        return "Dúvida";
      case "feature":
        return "Sugestão";
      case "other":
        return "Outro";
    }
  };

  // Filter application
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesClient = clientFilter === "all" || t.customerEmail.toLowerCase().trim() === clientFilter.toLowerCase().trim();
    const matchesCompany = companyFilter === "all" || t.company === companyFilter;

    // SLA Calculation
    const lastUpdate = new Date(t.updatedAt || t.createdAt);
    const hoursSinceLastUpdate = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));
    const isOverdueSLA = (t.status === "open" || t.status === "in_progress") && hoursSinceLastUpdate >= 24;

    const matchesSla = 
      slaFilter === "all" ||
      (slaFilter === "overdue" && isOverdueSLA) ||
      (slaFilter === "ok" && (t.status === "open" || t.status === "in_progress") && !isOverdueSLA);

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesClient && matchesCompany && matchesSla;
  });

  const getRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) return "Agora mesmo";
      if (diffMinutes === 1) return "Há 1 minuto";
      if (diffMinutes < 60) return `Há ${diffMinutes} minutos`;
      if (diffHours === 1) return "Há 1 hora";
      if (diffHours < 24) return `Há ${diffHours} horas`;
      if (diffDays === 1) return "Ontem";
      return `Há ${diffDays} dias`;
    } catch {
      return "Data indisponível";
    }
  };

  return (
    <div className="space-y-4">
      {/* Painel de Filtros Avançados */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
        {/* Pesquisa Livre */}
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por Código, Assunto, Conteúdo, Empresa ou Cliente..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Seletores dos Filtros */}
        <div className={`grid grid-cols-1 ${mode === "agent" ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-2 pt-1`}>
          {/* Status */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status:</span>
            <select
              className="w-full bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-hidden"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "all")}
            >
              <option value="all">Ver Todos</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Atendimento</option>
              <option value="solved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>
          </div>

          {/* Prioridade */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Urgência:</span>
            <select
              className="w-full bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-hidden"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "all")}
            >
              <option value="all">Ver Todas</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          {/* Categoria */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Canal/Tipo:</span>
            <select
              className="w-full bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-hidden"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | "all")}
            >
              <option value="all">Ver Todas</option>
              <option value="technical">Técnico</option>
              <option value="billing">Financeiro</option>
              <option value="question">Dúvida</option>
              <option value="feature">Sugestão</option>
              <option value="other">Outro</option>
            </select>
          </div>

          {/* Empresa */}
          {availableCompanies && availableCompanies.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Empresa:</span>
              <select
                className="w-full bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-hidden"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="all">Ver Todas</option>
                {availableCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* SLA Filtro para Painel de Agente */}
          {mode === "agent" && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">SLA:</span>
              <select
                className="w-full bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-hidden cursor-pointer"
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value as "all" | "ok" | "overdue")}
              >
                <option value="all">Todos os SLAs</option>
                <option value="ok">No Prazo (≤ 24h)</option>
                <option value="overdue">SLA Estourado (&gt; 24h)</option>
              </select>
            </div>
          )}
        </div>

        {/* Filtro de quem/cliente ativo */}
        {clientFilter !== "all" && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-800 animate-in fade-in duration-100">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold shrink-0">Filtrando por cliente (e-mail):</span>
              <code className="bg-white/70 px-1.5 py-0.5 rounded border border-blue-200/50 truncate font-mono text-[10px]">{clientFilter}</code>
            </span>
            <button
              type="button"
              onClick={() => setClientFilter("all")}
              className="text-blue-600 hover:text-blue-800 font-bold ml-2 hover:underline cursor-pointer text-[11px]"
            >
              Remover
            </button>
          </div>
        )}

        {/* Filtro de empresa ativa */}
        {companyFilter !== "all" && propCompanyFilter !== undefined && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-800 animate-in fade-in duration-100">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold shrink-0">Filtrando por empresa:</span>
              <code className="bg-white/70 px-1.5 py-0.5 rounded border border-blue-200/50 truncate font-mono text-[10px]">{companyFilter}</code>
            </span>
            <button
              type="button"
              onClick={() => setCompanyFilter("all")}
              className="text-blue-600 hover:text-blue-800 font-bold ml-2 hover:underline cursor-pointer text-[11px]"
            >
              Remover
            </button>
          </div>
        )}

        {/* Resumo pós-filtro */}
        <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-2 px-1">
          <span>Encontrados: <b className="text-slate-600">{filteredTickets.length}</b> de <b className="text-slate-600">{tickets.length}</b> total</span>
          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || slaFilter !== "all" || clientFilter !== "all" || companyFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setCategoryFilter("all");
                setSlaFilter("all");
                setClientFilter("all");
                setCompanyFilter("all");
              }}
              className="text-blue-600 font-medium hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Cards de Tickets */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredTickets.length === 0 ? (
          <div className="bg-slate-50 text-center py-12 rounded-xl border border-dashed border-slate-200 p-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <span className="font-semibold text-slate-600 block text-sm">Nenhum chamado corresponde aos filtros</span>
            <p className="text-xs text-slate-400 mt-1">Crie um chamado completo ou altere os critérios dos seletores acima.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const statusConfig = getStatusStyle(ticket.status);
            const priorityConfig = getPriorityStyle(ticket.priority);
            const isSelected = selectedTicketId === ticket.id;

            // SLA Calculation
            const lastUpdatedDate = new Date(ticket.updatedAt || ticket.createdAt);
            const hoursSinceLastUpdate = Math.floor((new Date().getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60));
            const isOverdueSLA = (ticket.status === "open" || ticket.status === "in_progress") && hoursSinceLastUpdate >= 24;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className={`group bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected 
                    ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20" 
                    : mode === "agent" && isOverdueSLA
                      ? "border-red-200 border-l-4 border-l-red-500 bg-red-50/10 hover:border-red-300 hover:bg-red-50/20"
                      : "border-slate-100 hover:border-slate-300"
                }`}
              >
                {/* Lado Esquerdo: Identificação e Título */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* ID */}
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                      {ticket.id}
                    </span>
                    
                    {/* Status Pill */}
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusConfig.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>

                    {/* Category Label */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-150 rounded-sm px-1.5 py-0.5">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {getCategoryLabel(ticket.category)}
                    </span>

                    {/* Priority Label */}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${priorityConfig.badge}`}>
                      {priorityConfig.label}
                    </span>

                    {/* SLA Indicators exclusively in supporting agent mode */}
                    {mode === "agent" && (ticket.status === "open" || ticket.status === "in_progress") && (
                      isOverdueSLA ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-red-100 border-red-300 text-red-700 flex items-center gap-1.5 animate-pulse">
                          🚨 SLA ESTOURADO (+{hoursSinceLastUpdate}h)
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-250 text-emerald-800 flex items-center gap-1.5">
                          ⏱️ SLA OK ({24 - hoursSinceLastUpdate}h restante(s))
                        </span>
                      )
                    )}
                  </div>

                  {/* Assunto */}
                  <h4 className={`text-sm font-semibold text-slate-800 truncate ${isSelected ? "text-blue-900" : ""}`}>
                    {ticket.title}
                  </h4>

                  {/* Detalhes de criação */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                    {ticket.company && (
                      <span className="flex items-center gap-1">
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200 uppercase tracking-widest leading-none">
                          🏢 {ticket.company}
                        </span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {mode === "agent" ? ticket.customerName : "Você"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getRelativeTime(ticket.createdAt)}
                    </span>
                    {ticket.assignedAgent && (
                      <span className="flex items-center gap-1">
                        <FolderLock className="w-3 h-3 text-slate-400" />
                        Atribuído: <b className="text-slate-600 font-medium">{ticket.assignedAgent}</b>
                      </span>
                    )}
                    {ticket.interactions.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {ticket.interactions.filter(i => i.role !== 'system').length} msg
                      </span>
                    )}
                  </div>
                </div>

                {/* Seta de ação / mobile */}
                <div className="flex items-center justify-end">
                  <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? "text-blue-500 translate-x-1" : "text-slate-300 group-hover:text-slate-500"}`} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
