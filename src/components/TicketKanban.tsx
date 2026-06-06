import React, { useState } from "react";
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from "../types";
import { PlusCircle, Tag, Clock, MessageSquare, AlertCircle, Eye, Inbox, HelpCircle, Paperclip } from "lucide-react";

interface TicketKanbanProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  selectedTicketId?: string | null;
  availableCompanies?: string[];
}

export default function TicketKanban({ tickets, onSelectTicket, selectedTicketId, availableCompanies = [] }: TicketKanbanProps) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string | "all">("all");

  const getStatusStyle = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return {
          title: "Aberto",
          bg: "bg-blue-50/50 text-blue-800 border-blue-100",
          dot: "bg-blue-600",
          ring: "focus-within:ring-blue-600/10"
        };
      case "in_progress":
        return {
          title: "Em Atendimento",
          bg: "bg-amber-50/50 text-amber-800 border-amber-100",
          dot: "bg-amber-600",
          ring: "focus-within:ring-amber-600/10"
        };
      case "solved":
        return {
          title: "Resolvido",
          bg: "bg-emerald-50/50 text-emerald-800 border-emerald-100",
          dot: "bg-emerald-600",
          ring: "focus-within:ring-emerald-600/10"
        };
      case "closed":
        return {
          title: "Fechado",
          bg: "bg-slate-50/50 text-slate-800 border-slate-100",
          dot: "bg-slate-600",
          ring: "focus-within:ring-slate-600/10"
        };
    }
  };

  const getPriorityStyle = (priority: TicketPriority) => {
    switch (priority) {
      case "low":
        return { label: "Baixa", badge: "bg-slate-100 text-slate-600 border-slate-200" };
      case "medium":
        return { label: "Média", badge: "bg-blue-50 text-blue-700 border-blue-100" };
      case "high":
        return { label: "Alta", badge: "bg-amber-50 text-amber-700 border-amber-200" };
      case "urgent":
        return { label: "Urgente", badge: "bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse" };
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
        return "Melhoria";
      case "other":
        return "Outro";
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) return "Agora";
      if (diffMinutes < 60) return `${diffMinutes}m atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      if (diffDays === 1) return "Ontem";
      return `${diffDays}d atrás`;
    } catch {
      return "Data indisponível";
    }
  };

  // Filter application matching both query & status filter button clicked
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany = companyFilter === "all" || t.company === companyFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  // Calculate filtered counts (we must apply the company/search filters to the column counts too)
  const getColCount = (status: TicketStatus) => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = companyFilter === "all" || t.company === companyFilter;
      return t.status === status && matchesSearch && matchesCompany;
    }).length;
  };

  const columns: { status: TicketStatus; label: string; count: number }[] = [
    { status: "open", label: "Aberto", count: getColCount("open") },
    { status: "in_progress", label: "Em Atendimento", count: getColCount("in_progress") },
    { status: "solved", label: "Resolvido", count: getColCount("solved") },
    { status: "closed", label: "Fechado", count: getColCount("closed") }
  ];

  // Visual layout config based on active filter button
  const columnsToRender = statusFilter === "all" 
    ? columns 
    : columns.filter(c => c.status === statusFilter);

  return (
    <div className="space-y-5">
      
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 text-left">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">Quadro Kanban de Chamados</h4>
            <p className="text-xs text-slate-400">Acompanhe e filtre o andamento dos seus tickets em tempo real</p>
          </div>
          
          {/* Quick Search & Company Filter */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
            {availableCompanies && availableCompanies.length > 0 && (
              <select
                className="w-full sm:w-48 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="all">Todas Empresas</option>
                {availableCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              placeholder="🔍 Buscar pelo código ou assunto..."
              className="w-full sm:w-72 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filtering Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Situação:</span>
          
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              statusFilter === "all"
                ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            Todos os Chamados ({tickets.length})
          </button>

          {columns.map(col => {
            const isActive = statusFilter === col.status;
            let themeClass = "text-blue-700 hover:bg-blue-50 border-blue-200";
            if (col.status === "in_progress") themeClass = "text-amber-800 hover:bg-amber-50 border-amber-200";
            if (col.status === "solved") themeClass = "text-emerald-800 hover:bg-emerald-50 border-emerald-200";
            if (col.status === "closed") themeClass = "text-slate-600 hover:bg-slate-100 border-slate-200";

            let activeTheme = "bg-blue-600 text-white border-blue-600 shadow-xs";
            if (col.status === "in_progress") activeTheme = "bg-amber-600 text-white border-amber-600 shadow-xs";
            if (col.status === "solved") activeTheme = "bg-emerald-600 text-white border-emerald-600 shadow-xs";
            if (col.status === "closed") activeTheme = "bg-slate-600 text-white border-slate-600 shadow-xs";

            return (
              <button
                key={col.status}
                onClick={() => setStatusFilter(col.status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                  isActive ? activeTheme : `bg-white ${themeClass}`
                }`}
              >
                <span>{col.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {col.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban Board Scollable Area */}
      <div className={`grid grid-cols-1 ${columnsToRender.length === 1 ? "md:grid-cols-1" : columnsToRender.length === 2 ? "md:grid-cols-2" : columnsToRender.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"} gap-4 overflow-x-auto pb-4`}>
        {columnsToRender.map(col => {
          const colStyle = getStatusStyle(col.status);
          const colTickets = filteredTickets.filter(t => t.status === col.status);

          return (
            <div 
              key={col.status} 
              className={`bg-slate-100/60 rounded-2xl p-4 flex flex-col min-h-[460px] border border-slate-205/50 ${colStyle.ring} transition-all`}
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colStyle.dot} shrink-0 animate-pulse`} />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{col.label}</span>
                </div>
                <span className="text-xs font-mono font-extrabold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-500">
                  {colTickets.length}
                </span>
              </div>

              {/* Tickets Cards Area */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-1.5">
                {colTickets.length === 0 ? (
                  <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white/40 flex flex-col items-center justify-center text-center">
                    <Inbox className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Vazio</span>
                  </div>
                ) : (
                  colTickets.map(ticket => {
                    const isSelected = selectedTicketId === ticket.id;
                    const priorityConfig = getPriorityStyle(ticket.priority);
                    const attachmentCount = (ticket.attachments?.length || 0) + 
                      ticket.interactions.reduce((sum, inter) => sum + (inter.attachments?.length || 0), 0);

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => onSelectTicket(ticket)}
                        className={`group bg-white p-3.5 rounded-xl border text-left cursor-pointer transition shadow-2xs hover:shadow-xs hover:border-slate-300 select-none flex flex-col gap-2.5 relative ${
                          isSelected 
                            ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm" 
                            : "border-slate-200/80"
                        }`}
                      >
                        
                        {/* Tags list: ID, Priority, Category */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-mono text-[9px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {ticket.id}
                          </span>
                          
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${priorityConfig.badge}`}>
                            {priorityConfig.label}
                          </span>

                          <span className="text-[9px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-150 flex items-center gap-0.5 ml-auto">
                            <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            {getCategoryLabel(ticket.category)}
                          </span>
                        </div>

                        {/* Title & Preview description */}
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700 transition">
                            {ticket.title}
                          </h5>
                          {ticket.company && (
                            <span className="inline-block text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200 uppercase tracking-widest leading-none mt-1">
                              🏢 {ticket.company}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Card metadata row */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-450 shrink-0" />
                            {getRelativeTime(ticket.createdAt)}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Attachments Icon */}
                            {attachmentCount > 0 && (
                              <span className="flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-bold" title={`${attachmentCount} arquivo(s) anexados`}>
                                <Paperclip className="w-3 h-3 text-blue-500" />
                                {attachmentCount}
                              </span>
                            )}

                            {/* Message Bubble Count */}
                            <span className="flex items-center gap-0.5 font-bold" title="Total de interações">
                              <MessageSquare className="w-3 h-3 text-slate-350" />
                              {ticket.interactions.filter(i => i.role !== 'system').length}
                            </span>

                            <span className="p-1 rounded-sm group-hover:bg-slate-100 transition">
                              <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
