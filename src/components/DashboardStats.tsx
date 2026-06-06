/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TicketStats, TicketCategory, TicketStatus, Ticket } from "../types";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Archive, 
  TrendingUp, 
  Inbox,
  User,
  FilterX,
  ChevronRight,
  AlertTriangle,
  Building2
} from "lucide-react";

interface DashboardStatsProps {
  stats: TicketStats;
  tickets: Ticket[];
  activeStatus: TicketStatus | "all";
  activeCategory: TicketCategory | "all";
  activeCompany: string | "all";
  onStatusClick: (status: TicketStatus | "all") => void;
  onCategoryClick: (category: TicketCategory | "all") => void;
  onCompanyClick: (company: string | "all") => void;
  slaEnabled?: boolean;
  slaLimitHours?: number;
}

export default function DashboardStats({ 
  stats, 
  tickets = [],
  activeStatus,
  activeCategory,
  activeCompany,
  onStatusClick,
  onCategoryClick,
  onCompanyClick,
  slaEnabled = true,
  slaLimitHours = 24
}: DashboardStatsProps) {
  
  const getCategoryLabel = (category: TicketCategory): string => {
    const labels: Record<TicketCategory, string> = {
      technical: "Técnico",
      billing: "Financeiro",
      question: "Dúvida",
      feature: "Sugestão",
      other: "Outro"
    };
    return labels[category] || category;
  };

  // Safe percentage helper
  const percent = (value: number) => {
    if (!stats.total) return 0;
    return Math.round((value / stats.total) * 100);
  };

  // 1. Process 10 most recent unique companies dynamically
  const sortedTickets = [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const uniqueCompanies: Array<{ company: string; count: number; lastTicketDate: string }> = [];
  const seenCompanies = new Set<string>();

  for (const t of sortedTickets) {
    if (!t.company) continue;
    
    // We group by company
    const identifier = t.company.toLowerCase().trim();
    
    if (!seenCompanies.has(identifier)) {
      if (uniqueCompanies.length < 10) {
        seenCompanies.add(identifier);
        uniqueCompanies.push({
          company: t.company,
          count: 0,
          lastTicketDate: t.createdAt
        });
      }
    }
  }

  // Count tickets for all unique companies in our top 10 list
  uniqueCompanies.forEach(client => {
    client.count = tickets.filter(t => {
      return t.company && t.company.toLowerCase().trim() === client.company.toLowerCase().trim();
    }).length;
  });

  // Toggles
  const handleStatusToggle = (status: TicketStatus) => {
    if (activeStatus === status) {
      onStatusClick("all");
    } else {
      onStatusClick(status);
    }
  };

  const handleCategoryToggle = (category: TicketCategory) => {
    if (activeCategory === category) {
      onCategoryClick("all");
    } else {
      onCategoryClick(category);
    }
  };

  const handleCompanyToggle = (company: string) => {
    if (activeCompany.toLowerCase().trim() === company.toLowerCase().trim()) {
      onCompanyClick("all");
    } else {
      onCompanyClick(company);
    }
  };

  const hasAnyFilter = activeStatus !== "all" || activeCategory !== "all" || activeCompany !== "all";

  const clearAllDashboardFilters = () => {
    onStatusClick("all");
    onCategoryClick("all");
    onCompanyClick("all");
  };

  // Process visual alerts of SLA (older than 24h/custom hours unchanged)
  const nowTime = new Date().getTime();
  const openBreached = !slaEnabled ? [] : tickets.filter(t => {
    if (t.status !== "open") return false;
    const ut = new Date(t.updatedAt || t.createdAt).getTime();
    return (nowTime - ut) > (slaLimitHours * 60 * 60 * 1000);
  });

  const inProgressBreached = !slaEnabled ? [] : tickets.filter(t => {
    if (t.status !== "in_progress") return false;
    const ut = new Date(t.updatedAt || t.createdAt).getTime();
    return (nowTime - ut) > (slaLimitHours * 60 * 60 * 1000);
  });

  const totalBreached = openBreached.length + inProgressBreached.length;

  return (
    <div className="space-y-6">
      
      {/* SLA Global Alert Banner */}
      {slaEnabled && totalBreached > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-905 animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3.5 text-left shadow-3xs">
          <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="inline-block bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-3xs">ALERTA SLA CRÍTICO</span>
            <h4 className="font-extrabold text-rose-900 leading-tight text-sm">
              SLA de Atendimento Excedido!
            </h4>
            <p className="text-rose-700/90 text-xs leading-relaxed">
              Existem <b className="font-black text-rose-950">{totalBreached} chamado(s)</b> sem qualquer interação ou atualização há mais de <b className="font-extrabold text-rose-950">{slaLimitHours} horas</b> na fila operacional. Por favor, priorize estes clientes para restabelecer os índices de conformidade.
            </p>
          </div>
        </div>
      )}

      {/* Barra de Filtros Ativos no Dashboard com Botão para Limpar */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-sm">Filtros de Métricas Ativos:</span>
            {activeStatus !== "all" && (
              <span className="bg-white border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
                Situação: <b className="text-blue-700 capitalize">{activeStatus === "in_progress" ? "Em Atendimento" : activeStatus === "open" ? "Aberto" : activeStatus === "solved" ? "Resolvido" : "Fechado"}</b>
              </span>
            )}
            {activeCategory !== "all" && (
              <span className="bg-white border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
                Categoria: <b className="text-blue-700">{getCategoryLabel(activeCategory)}</b>
              </span>
            )}
            {activeCompany !== "all" && (
              <span className="bg-white border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold max-w-[240px] truncate">
                Empresa: <b className="text-blue-700">{activeCompany}</b>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={clearAllDashboardFilters}
            className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition hover:underline cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" />
            Limpar Filtros de Métricas
          </button>
        </div>
      )}

      {/* 1. Métricas por Situação (Cards Principais Interativos) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Métricas por Situação (Clique para Filtrar)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Total */}
          <div 
            onClick={() => {
              onStatusClick("all");
              onCategoryClick("all");
              onClientClick("all");
            }}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
              !hasAnyFilter 
                ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-350 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between opacity-80">
              <span className="text-[10px] font-bold uppercase tracking-wider">Todos</span>
              <Inbox className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 text-left">
              <h3 className="text-2xl font-bold tracking-tight">{stats.total}</h3>
              <p className="text-[10px] opacity-75 mt-0.5">Total de chamados</p>
            </div>
          </div>

          {/* Aberto */}
          <div 
            onClick={() => handleStatusToggle("open")}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
              activeStatus === "open"
                ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/25"
                : "bg-white hover:bg-blue-50/20 border-slate-200 hover:border-blue-205 shadow-xs"
            }`}
          >
            <div className={`flex items-center justify-between ${activeStatus === "open" ? "text-white" : "text-blue-500"}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">Abertos</span>
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 text-left">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-bold tracking-tight">{stats.open}</h3>
                {openBreached.length > 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                    activeStatus === "open"
                      ? "bg-red-500/30 text-white border-red-400"
                      : "bg-red-50 text-red-600 border-red-100 animate-pulse"
                  }`} title={`${openBreached.length} chamado(s) fora do SLA (>${slaLimitHours}h)`}>
                    <AlertTriangle className="w-2.5 h-2.5 text-red-550 shrink-0" />
                    <span>{openBreached.length} SLA</span>
                  </span>
                )}
              </div>
              <p className={`text-[10px] mt-0.5 ${activeStatus === "open" ? "text-blue-100" : "text-slate-500"}`}>
                {percent(stats.open)}% da fila
              </p>
            </div>
          </div>

          {/* Em Atendimento */}
          <div 
            onClick={() => handleStatusToggle("in_progress")}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
              activeStatus === "in_progress"
                ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/25"
                : "bg-white hover:bg-amber-50/20 border-slate-200 hover:border-amber-205 shadow-xs"
            }`}
          >
            <div className={`flex items-center justify-between ${activeStatus === "in_progress" ? "text-white" : "text-amber-500"}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider font-semibold">Triage / Pendente</span>
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 text-left">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-bold tracking-tight">{stats.inProgress}</h3>
                {inProgressBreached.length > 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                    activeStatus === "in_progress"
                      ? "bg-red-500/30 text-white border-red-400"
                      : "bg-red-50 text-red-650 border-red-100 animate-pulse"
                  }`} title={`${inProgressBreached.length} chamado(s) fora do SLA (>${slaLimitHours}h)`}>
                    <AlertTriangle className="w-2.5 h-2.5 text-red-550 shrink-0" />
                    <span>{inProgressBreached.length} SLA</span>
                  </span>
                )}
              </div>
              <p className={`text-[10px] mt-0.5 ${activeStatus === "in_progress" ? "text-amber-500/10" : "text-slate-500"}`}>
                {percent(stats.inProgress)}% em progresso
              </p>
            </div>
          </div>

          {/* Resolvido */}
          <div 
            onClick={() => handleStatusToggle("solved")}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
              activeStatus === "solved"
                ? "bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-500/25"
                : "bg-white hover:bg-green-50/20 border-slate-200 hover:border-green-205 shadow-xs"
            }`}
          >
            <div className={`flex items-center justify-between ${activeStatus === "solved" ? "text-white" : "text-green-500"}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">Solucionados</span>
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 text-left">
              <h3 className="text-2xl font-bold tracking-tight">{stats.solved}</h3>
              <p className={`text-[10px] mt-0.5 ${activeStatus === "solved" ? "text-green-100" : "text-slate-500"}`}>
                {percent(stats.solved)}% sucesso
              </p>
            </div>
          </div>

          {/* Fechados */}
          <div 
            onClick={() => handleStatusToggle("closed")}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
              activeStatus === "closed"
                ? "bg-slate-650 text-white border-slate-650 shadow-md"
                : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className={`flex items-center justify-between ${activeStatus === "closed" ? "text-white" : "text-slate-500"}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">Fechados</span>
              <Archive className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 text-left">
              <h3 className="text-2xl font-bold tracking-tight">{stats.closed}</h3>
              <p className={`text-[10px] mt-0.5 ${activeStatus === "closed" ? "text-slate-200 block" : "text-slate-500"}`}>
                {percent(stats.closed)}% arquivados
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Grid de Duas Partes: Categoria & 10 Últimos Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Distribuição por Categoria */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 text-left">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Métricas por Categoria (Canal / Natureza)
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Selecione uma categoria para vincular chamados da fila</p>
          </div>

          <div className="space-y-2.5">
            {(Object.keys(stats.byCategory) as TicketCategory[]).map(category => {
              const count = stats.byCategory[category] || 0;
              const barPercent = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              const isSelected = activeCategory === category;

              const barColors: Record<TicketCategory, string> = {
                technical: "bg-blue-500",
                billing: "bg-emerald-500",
                question: "bg-indigo-500",
                feature: "bg-purple-500",
                other: "bg-slate-500"
              };

              return (
                <div 
                  key={category} 
                  onClick={() => handleCategoryToggle(category)}
                  className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50/30" 
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block animate-ping" />}
                      {getCategoryLabel(category)}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">{count} ({Math.round(barPercent)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${barColors[category] || 'bg-slate-400'}`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 10 Últimas Empresas com Chamados */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 text-left">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm float-right">Limite: Top 10</span>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Métricas apenas por Empresa
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Filtre a fila instantaneamente clicando na empresa</p>
          </div>

          <div className="space-y-1.5 max-h-[265px] overflow-y-auto pr-1">
            {uniqueCompanies.length === 0 ? (
              <div className="text-center py-10 font-medium text-slate-400 text-xs">
                Nenhuma empresa registrada na base.
              </div>
            ) : (
              uniqueCompanies.map((client) => {
                const identifier = client.company;
                const isSelected = activeCompany.toLowerCase().trim() === client.company.toLowerCase().trim();
                
                return (
                  <button
                    key={identifier}
                    type="button"
                    onClick={() => handleCompanyToggle(client.company)}
                    className={`w-full p-2 rounded-xl text-left border transition-all duration-150 flex items-center justify-between gap-3 ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50 text-blue-900" 
                        : "border-slate-100 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full shrink-0 font-bold text-xs flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-650 border border-slate-200'
                      }`}>
                        {client.company.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <span className="font-bold block text-xs truncate max-w-[140px] md:max-w-[180px]">{client.company}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-550 border border-slate-200/60'
                      }`}>
                        {client.count} chamado{client.count !== 1 && 's'}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
