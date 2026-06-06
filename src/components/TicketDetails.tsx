/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Ticket, TicketStatus, TicketPriority, TicketInteraction, TicketCategory } from "../types";
import { getAccessToken } from "../lib/firebase";
import { 
  User, 
  Mail, 
  Clock, 
  Send, 
  ShieldCheck, 
  ChevronDown, 
  UserCheck, 
  Tag, 
  Trash2, 
  ArrowLeft,
  Loader2,
  CalendarDays,
  Paperclip,
  X,
  Building2,
  Share2,
  MessageSquare
} from "lucide-react";

interface TicketDetailsProps {
  ticket: Ticket;
  onUpdateTicket: (updatedTicket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  mode: "customer" | "agent";
  onBackToList?: () => void;
  agentEmail?: string;
}

export default function TicketDetails({ ticket, onUpdateTicket, onDeleteTicket, mode, onBackToList, agentEmail }: TicketDetailsProps) {
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<Array<{ name: string; dataUrl: string; size?: number; type?: string }>>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSpaceName, setShareSpaceName] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files) as File[];
    const newAttachments = [...replyAttachments];
    setAttachmentError(null);

    for (const file of fileList) {
      if (file.size > 2 * 1024 * 1024) {
        setAttachmentError("Cada arquivo deve possuir no máximo 2MB.");
        continue;
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

        newAttachments.push({
          name: file.name,
          dataUrl: base64Data,
          size: file.size,
          type: file.type
        });
      } catch (err) {
        console.error("Erro ao converter arquivo:", err);
      }
    }

    setReplyAttachments(newAttachments);
    e.target.value = ""; // Clear file selector input
  };

  const removeAttachment = (indexToRemove: number) => {
    setReplyAttachments(replyAttachments.filter((_, i) => i !== indexToRemove));
  };
  
  // Custom states matching local changes
  const [selectedAgent, setSelectedAgent] = useState(ticket.assignedAgent || "");
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>(ticket.priority);

  // Sync state if ticket changes
  useEffect(() => {
    setSelectedAgent(ticket.assignedAgent || "");
    setSelectedPriority(ticket.priority);
  }, [ticket]);

  const [analysts, setAnalysts] = useState<Array<{ name: string; email: string; profile: string }>>([]);

  useEffect(() => {
    if (mode === "agent") {
      const fetchAnalysts = async () => {
        try {
          const response = await fetch("/api/analysts");
          if (response.ok) {
            const data = await response.json();
            setAnalysts(data);
          }
        } catch (err) {
          console.error("Erro ao obter lista de analistas:", err);
        }
      };
      fetchAnalysts();
    }
  }, [mode]);

  const dynamicNames = analysts.map(a => a.name);
  const fallbackNames = ["Lucas Souza", "Aline Santos", "Beatriz Costa", "Tiago Oliveira"];
  const baseNames = dynamicNames.length > 0 ? dynamicNames : fallbackNames;
  
  const uniqueNames = new Set(baseNames);
  if (ticket.assignedAgent) {
    uniqueNames.add(ticket.assignedAgent);
  }
  const STAFF_AGENTS = Array.from(uniqueNames);

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case "open": return "Aberto";
      case "in_progress": return "Em Atendimento";
      case "solved": return "Resolvido";
      case "closed": return "Fechado";
    }
  };

  const getCategoryLabel = (category: TicketCategory) => {
    switch (category) {
      case "technical": return "🔧 Técnico";
      case "billing": return "💳 Financeiro";
      case "question": return "❓ Dúvida";
      case "feature": return "💡 Sugestão";
      case "other": return "📦 Outro";
    }
  };

  const getPriorityLabel = (priority: TicketPriority) => {
    switch (priority) {
      case "low": return "🟢 Baixa";
      case "medium": return "🔵 Média";
      case "high": return "🟠 Alta";
      case "urgent": return "🔴 Urgente";
    }
  };

  // Submit comment/communication back-and-forth
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() && replyAttachments.length === 0) return;

    setIsSendingReply(true);

    try {
      const authorName = mode === "agent" ? (selectedAgent || "Atendente Técnico") : ticket.customerName;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (agentEmail) {
        headers["X-Agent-Email"] = agentEmail;
      }

      const response = await fetch(`/api/tickets/${ticket.id}/interactions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          author: authorName,
          role: mode === "agent" ? "agent" : "customer",
          message: replyMessage.trim(),
          attachments: replyAttachments
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao salvar mensagem.");
      }

      const updatedTicket: Ticket = await response.json();
      setReplyMessage("");
      setReplyAttachments([]);
      onUpdateTicket(updatedTicket);
    } catch (err: any) {
      alert(err.message || "Houve um problema ao postar a mensagem. Tente novamente.");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Agent quick status changes
  const handleStatusChange = async (nextStatus: TicketStatus) => {
    setIsUpdatingState(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (agentEmail) {
        headers["X-Agent-Email"] = agentEmail;
      }

      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: nextStatus,
          agentName: mode === "agent" ? (selectedAgent || "Atendente") : undefined
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao alterar o status do ticket.");
      }
      const updated: Ticket = await response.json();
      onUpdateTicket(updated);
    } catch (err: any) {
      alert(err.message || "Erro ao alterar os dados do chamado.");
    } finally {
      setIsUpdatingState(false);
    }
  };

  // Agent priority changes
  const handlePriorityChange = async (nextPriority: TicketPriority) => {
    setSelectedPriority(nextPriority);
    setIsUpdatingState(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (agentEmail) {
        headers["X-Agent-Email"] = agentEmail;
      }

      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          priority: nextPriority,
          agentName: mode === "agent" ? (selectedAgent || "Atendente") : undefined
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao alterar a prioridade.");
      }
      const updated: Ticket = await response.json();
      onUpdateTicket(updated);
    } catch (err: any) {
      alert(err.message || "Erro ao alterar a prioridade.");
    } finally {
      setIsUpdatingState(false);
    }
  };

  // Agent assignments change
  const handleAgentAssignment = async (nextAgent: string) => {
    setSelectedAgent(nextAgent);
    setIsUpdatingState(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (agentEmail) {
        headers["X-Agent-Email"] = agentEmail;
      }

      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          assignedAgent: nextAgent || null,
          agentName: "Gestor de Equipe"
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao atualizar o atendente.");
      }
      const updated: Ticket = await response.json();
      onUpdateTicket(updated);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar o atendente.");
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleShareChat = async () => {
    if (!shareSpaceName.trim()) {
      setShareMessage({ type: 'error', text: 'Por favor, insira o ID do espaço.' });
      return;
    }

    setIsSharing(true);
    setShareMessage(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Sessão Google ausente. Conecte-se na tela de Integrações primeiro.");
      }

      // 1. Post to Chat
      const res = await fetch(`https://chat.googleapis.com/v1/${shareSpaceName}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `🚨 *Chamado Compartilhado: ${ticket.id}*\n*Assunto:* ${ticket.title}\n*Empresa / Cliente:* ${ticket.company || ticket.customerEmail}\n*Prioridade:* ${getPriorityLabel(ticket.priority)}\n*Status:* ${getStatusLabel(ticket.status)}\n\n_Compartilhado por: ${localStorage.getItem('agentSession') ? JSON.parse(localStorage.getItem('agentSession')!).name : agentEmail}_`
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Erro do Google Chat: ${errData.error?.message || "Falha ao enviar."}`);
      }

      // 2. Post to Chat History API
      const historyRes = await fetch("/api/chat-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          agentName: localStorage.getItem('agentSession') ? JSON.parse(localStorage.getItem('agentSession')!).name : (agentEmail || "Atendente"),
          agentEmail: agentEmail || "",
          spaceName: shareSpaceName
        })
      });

      if (!historyRes.ok) {
        throw new Error("Mensagem enviada, mas houve falha ao salvar no histórico.");
      }

      setShareMessage({ type: 'success', text: 'Chamado compartilhado com sucesso!' });
      setTimeout(() => setShowShareModal(false), 2000);
    } catch (err: any) {
      console.error(err);
      setShareMessage({ type: 'error', text: err.message || "Erro ao compartilhar chamado no Chat." });
    } finally {
      setIsSharing(false);
    }
  };

  // Delete ticket (cleanup helper)
  const handleDelete = async () => {
    if (!window.confirm(`Você tem certeza absoluta de que deseja excluir permanentemente o chamado ${ticket.id}?`)) {
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (agentEmail) {
        headers["X-Agent-Email"] = agentEmail;
      }

      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "DELETE",
        headers
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao remover o chamado do banco de dados.");
      }
      onDeleteTicket(ticket.id);
    } catch (err: any) {
      alert(err.message || "Erro ao remover o chamado do banco de dados.");
    }
  };

  // Formatting date string helpers
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Status index for progress timeline
  const getStatusStepIndex = (status: TicketStatus) => {
    const order: TicketStatus[] = ["open", "in_progress", "solved", "closed"];
    return order.indexOf(status);
  };

  const currentStep = getStatusStepIndex(ticket.status);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* Top Header Barra do Chamado */}
      <div className="bg-slate-50 border-b border-slate-150 px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              title="Voltar para a lista"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-sm">
                {ticket.id}
              </span>
              <span className="text-[11px] font-bold text-slate-400">|</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Criado em: {formatDateTime(ticket.createdAt)}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight mt-1 line-clamp-1">{ticket.title}</h3>
          </div>
        </div>

        {/* Top actions for staff */}
        {mode === "agent" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 text-slate-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors cursor-pointer relative group"
              title="Compartilhar no Google Chat"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer relative group"
              title="Excluir Chamado Permanentemente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Pipeline Estágios Progress Tracker */}
      <div className="bg-white px-6 py-4 border-b border-slate-50">
        <div className="flex items-center justify-between relative max-w-xl mx-auto py-2">
          {/* Background Connecting bar */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          
          {/* Active Connecting bar portion */}
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-500 z-0" 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />

          {/* Steps */}
          {["open", "in_progress", "solved", "closed"].map((st, idx) => {
            const label = getStatusLabel(st as TicketStatus);
            const isCompleted = currentStep >= idx;
            const isCurrent = currentStep === idx;

            return (
              <div key={st} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${
                    isCurrent 
                      ? "bg-blue-600 text-white" 
                      : isCompleted 
                        ? "bg-blue-500 text-white" 
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCurrent ? "⚙" : isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] sm:text-xs font-semibold mt-1.5 ${
                  isCurrent ? "text-blue-600 font-bold" : "text-slate-400"
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Container Dividido (Esquerda: Detalhes, Centro: Timeline/Conversas) */}
      <div className="grid md:grid-cols-12 flex-1 overflow-hidden">
        {/* Painel Esquerda: Dados cadastrados do Ticket e Controles */}
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100 p-5 space-y-5 bg-slate-50/50 max-h-[220px] md:max-h-none overflow-y-auto">
          
          {/* Sessão SLA Visual - Exclusivo do Atendente */}
          {mode === "agent" && (() => {
            const lastUpdated = new Date(ticket.updatedAt || ticket.createdAt);
            const hoursSinceUpdate = Math.floor((new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60));
            const isSlaBreached = (ticket.status === "open" || ticket.status === "in_progress") && hoursSinceUpdate >= 24;
            const percentElapsed = Math.min(100, Math.floor((hoursSinceUpdate / 24) * 100));

            return (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acordo de SLA (24 Horas)</h4>
                <div className={`p-4 rounded-xl border ${
                  ticket.status === "solved" || ticket.status === "closed"
                    ? "bg-slate-100 border-slate-200 text-slate-700"
                    : isSlaBreached
                      ? "bg-red-50 border-red-200 text-red-900 animate-pulse"
                      : "bg-emerald-50/50 border-emerald-100 text-emerald-950"
                }`}>
                  {ticket.status === "solved" || ticket.status === "closed" ? (
                    <div className="space-y-1 text-left">
                      <span className="text-xs font-bold text-slate-600 block flex items-center gap-1">
                        ✔️ SLA Encerrado
                      </span>
                      <p className="text-[10px] text-slate-400">Este ticket já está finalizado, congelando a contagem de tempo.</p>
                    </div>
                  ) : isSlaBreached ? (
                    <div className="space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-700 block flex items-center gap-1">
                          🚨 SLA Estourado!
                        </span>
                        <span className="text-[10px] font-bold font-mono text-red-700 bg-red-100 px-1.5 py-0.2 rounded-xs uppercase">Estourado</span>
                      </div>
                      <p className="text-[11px] text-red-800 leading-relaxed font-sans">
                        Este ticket está há <b>{hoursSinceUpdate} horas</b> sem respostas ou atualizações. Limite de 24h foi violado.
                      </p>
                      
                      {/* Red Progress Bar */}
                      <div className="w-full bg-red-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-850 block flex items-center gap-1">
                          ⏱️ No Prazo (Ativo)
                        </span>
                        <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-xs uppercase">Ok</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">
                        Última modificação há {hoursSinceUpdate}h. Restam cerca de <b>{24 - hoursSinceUpdate} hora(s)</b> antes de violar o SLA.
                      </p>

                      {/* Dynamic Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[9px] font-mono font-medium text-slate-400">
                          <span>Criado/Modific. (0h)</span>
                          <span>Prazo (24h)</span>
                        </div>
                        <div className="w-full bg-slate-250 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${
                            percentElapsed > 80 
                              ? "bg-orange-500" 
                              : percentElapsed > 50 
                                ? "bg-amber-500" 
                                : "bg-emerald-600"
                          }`} style={{ width: `${percentElapsed}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500 pt-0.5">
                          <span>SLA Utilizado: {percentElapsed}%</span>
                          <span>{24 - hoursSinceUpdate}h restantes</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Dados do Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informações da Empresa / Cliente</h4>
            <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-100">
              {ticket.company && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-sm">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-800 truncate" title={ticket.company}>
                    {ticket.company}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-xs">
                <div className="p-1.5 bg-slate-105 text-slate-600 rounded-sm">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-slate-700 truncate">{ticket.customerName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="p-1.5 bg-slate-105 text-slate-600 rounded-sm">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-500 truncate" title={ticket.customerEmail}>{ticket.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Informações de categorização */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atributos</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Categoria</span>
                <span className="text-xs font-semibold text-slate-700 block mt-0.5">{getCategoryLabel(ticket.category)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Urgência</span>
                <span className="text-xs font-semibold text-slate-700 block mt-0.5">{getPriorityLabel(ticket.priority)}</span>
              </div>
            </div>
          </div>

          {/* CONTROLES EXCLUSIVOS DO ATENDENTE */}
          {mode === "agent" && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ações do Analista</h4>
              
              {/* Atribuir Atendente */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Atribuir Analista:</label>
                <div className="relative">
                  <select
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
                    value={selectedAgent}
                    onChange={(e) => handleAgentAssignment(e.target.value)}
                  >
                    <option value="">Não Atribuído</option>
                    {STAFF_AGENTS.map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mudar Prioridade */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Nível de Criticidade:</label>
                <select
                  className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
                  value={selectedPriority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                >
                  <option value="low">🟡 Baixa</option>
                  <option value="medium">🔵 Média</option>
                  <option value="high">🟠 Alta</option>
                  <option value="urgent">🔴 Urgente</option>
                </select>
              </div>

              {/* Mudar Status (Aberto, Atendimento, Resolvido) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-500 block">Alterar Status Rápidos:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={ticket.status === "in_progress"}
                    className="py-1.5 px-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer text-center"
                  >
                    Atender
                  </button>
                  <button
                    onClick={() => handleStatusChange("solved")}
                    disabled={ticket.status === "solved"}
                    className="py-1.5 px-2 bg-green-50 border border-green-200 text-green-900 rounded-lg text-[11px] font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors cursor-pointer text-center"
                  >
                    Resolver
                  </button>
                  <button
                    onClick={() => handleStatusChange("closed")}
                    disabled={ticket.status === "closed"}
                    className="col-span-2 py-1.5 px-2 bg-slate-100 border border-slate-200 text-slate-900 rounded-lg text-[11px] font-semibold hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer text-center"
                  >
                    Fechar Chamado
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTROLES EXCLUSIVOS DO CLIENTE */}
          {mode === "customer" && (
            <div className="space-y-4 border-t border-slate-100 pt-4 text-left">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ações do Cliente</h4>
              {ticket.status !== "closed" ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Se o seu problema foi resolvido pelo nosso time e você deseja encerrar o chamado definitivamente, clique no botão abaixo:
                  </p>
                  <button
                    onClick={() => handleStatusChange("closed")}
                    disabled={isUpdatingState}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {isUpdatingState ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "🔒 Finalizar e Fechar Chamado"
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-150 text-slate-500 rounded-xl text-center text-xs font-bold">
                  🔒 Este chamado já está finalizado.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Painel Direita: Timeline Conversas e Form de Respostas */}
        <div className="md:col-span-8 flex flex-col overflow-hidden h-[380px] md:h-full">
          {/* Caixa de Mensagens do Chat / Linha do Tempo */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
            {/* Mensagem Principal do Ticket (Post Original) */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs max-w-2xl">
              <div className="flex justify-between items-center border-b border-rose-50 pb-2.5 mb-2.5">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  POST ORIGINAL DO CHAMADO
                </span>
                <span className="text-[11px] font-mono text-slate-400">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-line">
                {ticket.description}
              </p>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-left">
                  <span className="text-[10px] font-bold text-slate-400 block w-full uppercase tracking-wider">Arquivos Anexados:</span>
                  {ticket.attachments.map((file, i) => (
                    <a
                      key={i}
                      href={file.dataUrl}
                      download={file.name}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg text-xs font-semibold text-blue-800 transition max-w-[240px] truncate"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Iterações subsequentes do Banco de Dados */}
            {ticket.interactions.slice(1).map((interaction) => {
              if (interaction.role === "system") {
                const isEmail = interaction.message.includes("✉️");
                const isWhatsApp = interaction.message.includes("📲");
                
                return (
                  // Logs ou Comunicados Automáticos do Sistema
                  <div key={interaction.id} className="flex justify-center my-3 w-full">
                    <div className={`text-[10px] md:text-xs px-4 py-2 rounded-xl text-center max-w-lg shadow-3xs flex items-center gap-2 border font-sans font-medium leading-relaxed ${
                      isEmail
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : isWhatsApp
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                      {isEmail ? (
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : isWhatsApp ? (
                        <span className="text-sm shrink-0">📲</span>
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className="text-left">{interaction.message}</span>
                      <span className="text-[9px] text-slate-400 font-normal font-mono shrink-0">({formatDateTime(interaction.createdAt).split(",")[1]?.trim() || ""})</span>
                    </div>
                  </div>
                );
              }

              // Mensagem do Usuário / Atendente
              const isStaff = interaction.role === "agent";
              return (
                <div 
                  key={interaction.id} 
                  className={`flex ${isStaff ? "justify-end" : "justify-start"}`}
                >
                  <div className={`rounded-xl px-4 py-3 max-w-[85%] shadow-3xs border ${
                    isStaff 
                      ? "bg-blue-50 text-blue-950 border-blue-100" 
                      : "bg-white text-slate-800 border-slate-100"
                  }`}>
                    {/* Autor / Role Badge */}
                    <div className="flex items-center justify-between gap-6 pb-1 mb-1 border-b border-transparent">
                      <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: isStaff ? '#1d4ed8' : '#334155' }}>
                        {interaction.author}
                        {isStaff && (
                          <span className="text-[9px] font-bold text-white bg-blue-600 px-1.5 py-0.2 rounded-xs tracking-wider uppercase">
                            Equipe
                          </span>
                        )}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{formatDateTime(interaction.createdAt)}</span>
                    </div>

                    {/* Texto real */}
                    <p className="text-sm font-sans leading-relaxed whitespace-pre-line">
                      {interaction.message}
                    </p>

                    {interaction.attachments && interaction.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100/60 flex flex-wrap gap-1.5 justify-start">
                        {interaction.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.dataUrl}
                            download={file.name}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 transition max-w-[180px] truncate"
                          >
                            <Paperclip className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form inferior de resposta para o Chat */}
          <div className="bg-white border-t border-slate-100 p-4">
            {mode === "customer" && ticket.status !== "open" && ticket.status !== "in_progress" ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-center text-xs font-bold">
                ⚠️ Clientes podem enviar comentários apenas em chamados com status "Aberto" ou "Em Atendimento".
              </div>
            ) : ticket.status === "closed" ? (
              <div className="bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-3 text-center text-xs font-semibold">
                Este ticket foi encerrado de forma definitiva pelo analista. Diálogos indisponíveis nesta folha.
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="flex flex-col gap-2">
                {mode === "customer" && (
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        Cliente
                      </span>
                      📝 Deseja inserir novas informações ou atualizações sobre o caso? Digite abaixo:
                    </label>
                  </div>
                )}
                
                {attachmentError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold rounded-lg text-left">
                    ⚠️ {attachmentError}
                  </div>
                )}

                <div className="flex gap-2 w-full items-end">
                  {/* File input button wrapper */}
                  <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-250 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer select-none" title="Anexar arquivos">
                    <Paperclip className="w-4 h-4 text-slate-550" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <textarea
                    required={replyAttachments.length === 0}
                    rows={mode === "customer" ? 3 : 2}
                    maxLength={1000}
                    placeholder={
                      mode === "agent" 
                        ? "Digite uma resposta clara para o cliente..." 
                        : "Adicione novos detalhes, evidências ou atualizações que ajudem nosso time a tratar o seu chamado..."
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 resize-none transition-all font-sans"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />

                  <button
                    type="submit"
                    disabled={isSendingReply || (!replyMessage.trim() && replyAttachments.length === 0)}
                    className={`px-4 py-2.5 ${mode === "customer" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50 text-white rounded-xl flex flex-col justify-center items-center transition-colors shadow-2xs cursor-pointer min-w-[50px] self-stretch`}
                    title="Enviar informação"
                  >
                    {isSendingReply ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Selected attachments list */}
                {replyAttachments.length > 0 && (
                  <div className="p-2 bg-slate-50 border border-slate-150 rounded-xl flex flex-wrap gap-1.5 max-h-32 overflow-y-auto mt-1">
                    {replyAttachments.map((file, idx) => (
                      <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-705 font-bold shadow-3xs max-w-xs truncate">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Compartilhar Modal (Agents Only) */}
      {showShareModal && (
        <div className="fixed inset-0 min-h-screen bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-extrabold text-slate-800 mb-2 tracking-tight">Compartilhar no Chat</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium px-4">
              Deseja compartilhar um alerta deste chamado no Google Chat? Insira o identificador do Espaço.
            </p>

            <div className="space-y-4 w-full mb-6">
              <div className="text-left w-full">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ID do Espaço (Space Name)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={shareSpaceName}
                    onChange={(e) => setShareSpaceName(e.target.value)}
                    placeholder="Ex: spaces/AAAAAxxx..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {shareMessage && (
              <div className={`p-3 text-xs w-full mb-4 font-medium rounded-lg border ${
                shareMessage.type === 'success' 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {shareMessage.text}
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareMessage(null);
                }}
                disabled={isSharing}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleShareChat}
                disabled={isSharing || !shareSpaceName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
