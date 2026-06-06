import React, { useEffect, useState } from "react";
import { Mail, Search, CheckCircle2, AlertCircle, Eye, RefreshCw, Layers, ShieldCheck, X, Send } from "lucide-react";
import { SentEmail } from "../types";

interface EmailOutboxMonitorProps {
  currentAgentEmail: string;
}

export default function EmailOutboxMonitor({ currentAgentEmail }: EmailOutboxMonitorProps) {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<SentEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "simulated" | "failed">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // SMTP Test Email form States
  const [testEmail, setTestEmail] = useState("");
  const [testName, setTestName] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: string;
    error?: string;
    smtpHost?: string;
  } | null>(null);

  // Resend Email States
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);
  const [resendNotification, setResendNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchEmails = async () => {
    setIsLoading(true);
    setPermissionError(null);
    try {
      const resp = await fetch("/api/emails", {
        headers: {
          "X-Agent-Email": currentAgentEmail
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        setEmails(data);
      } else {
        const errJson = await resp.json().catch(() => ({}));
        setPermissionError(errJson.error || "Seu perfil não possui permissão para visualizar o Monitor de E-mails.");
      }
    } catch (err) {
      console.error("Falha ao buscar logs de emails", err);
      setPermissionError("Erro de comunicação ao carregar a fila de e-mails.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/emails/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Email": currentAgentEmail
        },
        body: JSON.stringify({
          toEmail: testEmail,
          toName: testName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
        // Refresh list to show test log
        fetchEmails();
      } else {
        const errJson = await response.json().catch(() => ({}));
        setTestResult({
          success: false,
          status: "rejected",
          error: errJson.error || "Não autorizado a efetuar teste SMTP."
        });
      }
    } catch (err: any) {
      console.error("Erro ao enviar email de teste", err);
      setTestResult({
        success: false,
        status: "failed",
        error: err?.message || String(err),
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResendEmail = async (emailId: string) => {
    setResendingEmailId(emailId);
    setResendNotification(null);
    try {
      const response = await fetch(`/api/emails/${emailId}/resend`, {
        method: "POST",
        headers: {
          "X-Agent-Email": currentAgentEmail
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResendNotification({
            type: "success",
            message: `E-mail reenviado com sucesso! Envio efetuado via ${data.status === "sent" ? "SMTP Ativo" : "Simulador Sandbox"} (Novo log registrado).`
          });
        } else {
          setResendNotification({
            type: "error",
            message: `Falha no reenvio através do servidor SMTP: ${data.error || "Erro desconhecido"}`
          });
        }
        // Refresh logs
        fetchEmails();
      } else {
        const errJson = await response.json().catch(() => ({}));
        setResendNotification({
          type: "error",
          message: errJson.error || "O gateway de e-mails retornou uma resposta inválida ao processar o reenvio."
        });
      }
    } catch (err: any) {
      console.error("Erro ao processar reenvio de e-mail:", err);
      setResendNotification({
        type: "error",
        message: `Falha de solicitação: ${err?.message || String(err)}`
      });
    } finally {
      setResendingEmailId(null);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [currentAgentEmail]);

  useEffect(() => {
    let result = [...emails];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.ticketId.toLowerCase().includes(q) ||
          e.recipientEmail.toLowerCase().includes(q) ||
          e.recipientName.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }
    setFilteredEmails(result);
  }, [emails, searchQuery, statusFilter]);

  const getStatusBadge = (status: SentEmail["status"]) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Sucesso SMTP
          </span>
        );
      case "simulated":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono font-bold bg-blue-50 text-blue-600 border border-blue-150 px-2.5 py-1 rounded-full">
            <Layers className="w-3 h-3" />
            Simulado
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono font-bold bg-red-50 text-red-650 border border-red-200 px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Falha SMTP
          </span>
        );
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    permissionError ? (
      <div className="bg-red-50/50 border border-red-200 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4 animate-in fade-in duration-150 my-8">
        <Mail className="w-12 h-12 text-red-600/70 mx-auto" />
        <h4 className="font-bold text-red-950 text-sm">Acesso Restrito ao Monitor</h4>
        <p className="text-xs text-red-800 leading-relaxed">
          {permissionError}
        </p>
        <p className="text-[11px] text-slate-500">
          Se você acredita que isso é um erro ou precisa de atribuições do perfil de Técnico / Administrador, consulte o Administrador Master em <b>suporte@prestativaautomacao.com.br</b>.
        </p>
      </div>
    ) : (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        
        {/* Header and Sync Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600 animate-pulse" />
              Auditoria & Gateway de Disparo de E-mails
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Logs persistentes e rastreabilidade de todas as notificações automáticas de SLA enviadas a clientes.
            </p>
          </div>

        <button
          onClick={fetchEmails}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Sincronizando..." : "Sincronizar Outbox"}
        </button>
      </div>

      {/* Info Warning Card */}
      <div id="email-warning-info-card" className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-left">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0 h-9 w-9 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-blue-900">Operação Híbrida Inteligente (SMTP / Sandbox)</h4>
          <p className="text-[11px] text-blue-850 leading-relaxed">
            Se as variáveis <code className="bg-blue-150/40 px-1 py-0.2 rounded-xs font-mono font-bold text-blue-950">SMTP_HOST</code> e afins forem configuradas no painel de segredos do ambiente de execução, o sistema enviará emails reais automaticamente. Caso contrário, o sistema simula os disparos perfeitamente para permitir que você teste as integrações sem quebrar o fluxo.
          </p>
        </div>
      </div>

      {/* Resend Action feedback */}
      {resendNotification && (
        <div 
          id="resend-notification-banner" 
          className={`p-4 rounded-xl border text-xs text-left animate-in slide-in-from-top-2 duration-150 flex justify-between items-center ${
            resendNotification.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
              : "bg-red-50 border-red-200 text-red-950"
          }`}
        >
          <div className="flex gap-2.5 items-center">
            {resendNotification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <p className="font-semibold">{resendNotification.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => setResendNotification(null)}
            className="text-slate-450 hover:text-slate-800 transition p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Test Custom Form Card */}
      <div id="email-test-sender-panel" className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Mail className="w-4 h-4 text-blue-600" />
          </span>
          <div className="text-left">
            <h3 id="email-test-panel-title" className="text-xs font-bold text-slate-800 uppercase tracking-wider">Enviar E-mail de Teste Rapidamente</h3>
            <p className="text-[11px] text-slate-500">Valide se o seu servidor SMTP consegue disparar e-mails reais de forma segura.</p>
          </div>
        </div>

        <form id="email-test-form" onSubmit={handleSendTestEmail} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1 text-left">
            <label htmlFor="test-recipient-email-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail do Destinatário</label>
            <input
              id="test-recipient-email-input"
              type="email"
              required
              placeholder="exemplo@dominio.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
            />
          </div>
          <div className="space-y-1 text-left">
            <label htmlFor="test-recipient-name-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome do Destinatário (Opcional)</label>
            <input
              id="test-recipient-name-input"
              type="text"
              placeholder="Nome do Cliente"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-850 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
            />
          </div>
          <div>
            <button
              id="btn-trigger-email-test"
              type="submit"
              disabled={isSendingTest}
              className={`w-full py-2 px-4 rounded-lg text-xs font-bold text-white transition-all duration-200 cursor-pointer ${
                isSendingTest 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-2xs hover:shadow-xs active:bg-blue-800"
              }`}
            >
              {isSendingTest ? "Disparando..." : "Disparar E-mail de Teste"}
            </button>
          </div>
        </form>

        {testResult && (
          <div id="email-test-result-wrapper" className={`p-3.5 rounded-lg border text-xs text-left animate-in fade-in duration-150 flex gap-2.5 items-start ${
            testResult.success
              ? testResult.status === "sent"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
              : "bg-red-50 border-red-200 text-red-950"
          }`}>
            <span className="shrink-0 mt-0.5">
              {testResult.success ? (
                testResult.status === "sent" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Layers className="w-4 h-4 text-blue-600" />
                )
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
            </span>
            <div className="space-y-1">
              <h4 className="font-bold">
                {testResult.success
                  ? testResult.status === "sent"
                    ? "🎉 Notificação SMTP Enviada com Sucesso!"
                    : "⏱️ Notificação Simulada Registrada com Sucesso (Modo Sandbox)"
                  : "❌ Falha crítica ao enviar teste SMTP"}
              </h4>
              <p className="text-[11px] leading-relaxed">
                {testResult.success
                  ? testResult.status === "sent"
                    ? `O e-mail contendo o template visual de diagnóstico foi postado no servidor SMTP em [${testResult.smtpHost}] e encaminhado para ${testEmail} com sucesso.`
                    : `Simulação de disparo efetuada com sucesso para ${testEmail}. Para habilitar disparos de e-mail de verdade para seus respectivos clientes, preencha as variáveis de ambiente SMTP no painel do AI Studio de desenvolvimento.`
                  : `Servidor SMTP rejeitou a transação. Detalhes do erro: "${testResult.error || "Erro de conexão desconhecido"}". Certifique-se de preencher as variáveis e credenciais corretamente no painel do AI Studio.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <span className="absolute left-3.5 top-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por assunto, e-mail do cliente, nome ou ID de ticket..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="sm:col-span-4">
          <select
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-650 font-bold focus:outline-hidden cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Filtrar Todos os Status</option>
            <option value="sent">Sucesso SMTP (Em Produção)</option>
            <option value="simulated">Disparos Simulados (Desenvolvimento)</option>
            <option value="failed">Falhas no SMTP</option>
          </select>
        </div>
      </div>

      {/* Emails Log Table/List */}
      {filteredEmails.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/30">
          <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-600">Nenhum e-mail registrado</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Modifique o status de um ticket ou reabra um chamado resolvido para forçar o sistema a disparar uma notificação automática!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                <th className="p-3.5">Ticket</th>
                <th className="p-3.5">Destinatário</th>
                <th className="p-3.5">Assunto</th>
                <th className="p-3.5 font-mono">Timestamp</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmails.map((email) => (
                <tr key={email.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3.5 font-bold font-mono text-blue-600">{email.ticketId}</td>
                  <td className="p-3.5">
                    <span className="font-semibold block text-slate-800">{email.recipientName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{email.recipientEmail}</span>
                  </td>
                  <td className="p-3.5 font-medium max-w-xs truncate" title={email.subject}>
                    {email.subject}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                    {getRelativeTime(email.createdAt)}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    {getStatusBadge(email.status)}
                    {email.error && (
                      <span className="block text-[8px] text-red-500 max-w-[120px] truncate mx-auto font-mono mt-0.5" title={email.error}>
                        {email.error}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-650 hover:text-blue-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Visualizar e-mail completo em HTML"
                      >
                        <Eye className="w-3 h-3" />
                        Auditar
                      </button>

                      <button
                        disabled={resendingEmailId !== null}
                        onClick={() => handleResendEmail(email.id)}
                        className={`px-2.5 py-1.5 font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer ${
                          resendingEmailId === email.id
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs hover:shadow-xs active:bg-indigo-800"
                        }`}
                        title="Reenviar este e-mail imediatamente"
                      >
                        <Send className={`w-3 h-3 ${resendingEmailId === email.id ? "animate-spin" : ""}`} />
                        {resendingEmailId === email.id ? "Enviando..." : "Reenviar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Pop-up Dialog for Visual HTML E-mail Previewer */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-left">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Dialog Top Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Visualizando Conteúdo da Notificação</h3>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
                title="Fechar visualizador"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dialog Mail Details */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-1.5 text-xs font-sans">
              <div>
                <span className="font-bold text-slate-400 mr-2 uppercase text-[10px] tracking-wider w-16 inline-block">De:</span>
                <span className="font-mono text-slate-700">suporte@suaempresa.com (Mapeado no SMTP)</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 mr-2 uppercase text-[10px] tracking-wider w-16 inline-block">Para:</span>
                <span className="font-bold text-slate-800">{selectedEmail.recipientName}</span>
                <span className="font-mono text-slate-500 ml-1">({selectedEmail.recipientEmail})</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 mr-2 uppercase text-[10px] tracking-wider w-16 inline-block">Assunto:</span>
                <span className="font-semibold text-slate-800">{selectedEmail.subject}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 mr-2 uppercase text-[10px] tracking-wider w-16 inline-block">ID Ticket:</span>
                <span className="font-mono font-bold text-blue-600">{selectedEmail.ticketId}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 mr-2 uppercase text-[10px] tracking-wider w-16 inline-block">Status:</span>
                <span className="mr-3">{getStatusBadge(selectedEmail.status)}</span>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider inline-block">Data:</span>
                <span className="font-mono text-slate-650 ml-1">{getRelativeTime(selectedEmail.createdAt)}</span>
              </div>
            </div>

            {/* Error Diagnostics & Self-Healing Tips */}
            {selectedEmail.error && (
              <div className="bg-red-50/90 border-b border-red-200 p-5 text-xs text-red-950 text-left">
                <div className="flex gap-2.5 items-start">
                  <AlertCircle className="w-4.5 h-4.5 text-red-650 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <span className="font-bold block text-red-800 uppercase text-[10px] tracking-wider">Falha de Envio Relatada pelo SMTP:</span>
                    <pre className="bg-red-100/60 p-2.5 rounded-lg font-mono text-[10px] leading-relaxed max-w-full overflow-x-auto whitespace-pre-wrap select-all border border-red-200/40">
                      {selectedEmail.error}
                    </pre>

                    {/* Proactive diagnostic tips based on SMTP Error codes */}
                    {selectedEmail.error.includes("451") || selectedEmail.error.toLowerCase().includes("queue file write") ? (
                      <div className="mt-3 pt-3 border-t border-red-250/50 space-y-1.5 text-[11px] text-red-900 leading-relaxed">
                        <span className="font-bold flex items-center gap-1 text-red-700">
                          💡 Dica de Diagnóstico (Erro 451 4.3.0 de Fila do Servidor):
                        </span>
                        <p>
                          Este código de erro indica que seu <b>servidor de e-mails de saída (SMTP)</b> rejeitou a transação devido a um problema interno de gravação de arquivos temporários na fila de processamento dele.
                        </p>
                        <p className="font-semibold text-red-950 mt-1">Geralmente, isso ocorre se:</p>
                        <ul className="list-disc pl-4 space-y-1 mt-1 text-[10.5px]">
                          <li><b>Espaço em Disco Esgotado:</b> A partição de armazenamento do servidor SMTP está com 100% de uso de disco físico.</li>
                          <li><b>Limites de Quota:</b> O usuário SMTP ou a conta excederam o limite diário de mensagens/armazenamento contratado.</li>
                          <li><b>Permissão de Diretórios:</b> O diretório de fila (ex: Postfix <code>/var/spool/postfix</code>) está sem permissões de gravação para o usuário do mailer.</li>
                          <li><b>Esgotamento de Inodes:</b> O sistema de arquivos do servidor SMTP não possui mais inodes livres para novos arquivos de e-mail.</li>
                        </ul>
                        <p className="text-[10px] text-slate-500 italic mt-2">
                          Ação recomendada: Entre em contato com o suporte ou administrador do seu Host SMTP para verificar o status de armazenamento e arquivos do servidor correspondente.
                        </p>
                      </div>
                    ) : selectedEmail.error.toLowerCase().includes("auth") || selectedEmail.error.toLowerCase().includes("credentials") ? (
                      <div className="mt-3 pt-3 border-t border-red-250/50 space-y-1 text-[11px] text-red-900 leading-relaxed">
                        <span className="font-bold text-red-700 block">💡 Dica de Diagnóstico (Falha de Autenticação):</span>
                        <p>
                          As credenciais do SMTP fornecidas nas configurações do AI Studio ou <code>.env.example</code> foram rejeitadas pelo seu servidor de e-mail. Revise se o usuário e senha estão perfeitamente digitados e não contêm espaços extras.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-red-250/50 space-y-1 text-[11px] text-red-900 leading-relaxed">
                        <span className="font-bold text-red-700 block">💡 Dica de Diagnóstico (Conectividade):</span>
                        <p>
                          O gateway não conseguiu se conectar ao endereço do host SMTP. Verifique se o Hostname e a Porta (ex: 587 para TLS com STARTTLS, 465 para SSL criptografado) estão corretos e não há bloqueio de firewall na porta de saída.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Render Box (Safely Render HTML Mock Body) */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
              <div 
                className="bg-white rounded-xl shadow-xs border border-slate-250 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
              />
            </div>

            {/* Dialog Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center gap-3">
              <button
                disabled={resendingEmailId !== null}
                onClick={async () => {
                  const emailId = selectedEmail.id;
                  setSelectedEmail(null); // Close the dialog
                  await handleResendEmail(emailId);
                }}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  resendingEmailId === selectedEmail.id
                    ? "bg-slate-300 text-slate-550 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:bg-indigo-800"
                }`}
                title="Reenviar este e-mail imediatamente"
              >
                <Send className="w-3.5 h-3.5" />
                {resendingEmailId === selectedEmail.id ? "Reenviando..." : "Reenviar E-mail Agora"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fechar Auditoria de Email
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
);
}
