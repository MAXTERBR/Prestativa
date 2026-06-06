/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TicketCategory, TicketPriority, Ticket } from "../types";
import { PlusCircle, HelpCircle, Loader2, Calendar, Paperclip, X } from "lucide-react";

interface TicketFormProps {
  onSuccess: (newTicket: Ticket) => void;
  defaultEmail?: string;
  defaultName?: string;
  defaultCompany?: string;
  isAdminOrAgent?: boolean;
  availableCompanies?: string[];
  companyContacts?: Record<string, {name: string, email: string}[]>;
}

export default function TicketForm({ onSuccess, defaultEmail = "", defaultName = "", defaultCompany = "", isAdminOrAgent = false, availableCompanies = [], companyContacts = {} }: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("technical");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerEmail, setCustomerEmail] = useState(defaultEmail);
  const [company, setCompany] = useState(defaultCompany || (availableCompanies.length === 1 ? availableCompanies[0] : ""));
  const [attachments, setAttachments] = useState<Array<{ name: string; dataUrl: string; size?: number; type?: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (availableCompanies.length === 1 && !company && !defaultCompany) {
      setCompany(availableCompanies[0]);
    }
  }, [availableCompanies, company, defaultCompany]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCompany = e.target.value;
    setCompany(selectedCompany);

    if (selectedCompany && companyContacts[selectedCompany] && companyContacts[selectedCompany].length > 0) {
      // Pick the first contact for that company as the default
      const firstContact = companyContacts[selectedCompany][0];
      setCustomerName(firstContact.name);
      setCustomerEmail(firstContact.email);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files) as File[];
    const newAttachments = [...attachments];

    for (const file of fileList) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("Cada arquivo deve possuir no máximo 2MB.");
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

    setAttachments(newAttachments);
    e.target.value = ""; // clear after selection
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(attachments.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic Validation
    if (!title.trim() || !description.trim() || !customerName.trim() || !customerEmail.trim()) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios do formulário.");
      return;
    }

    if (!customerEmail.includes("@") || !customerEmail.includes(".")) {
      setErrorMessage("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          company: company.trim(),
          attachments
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro desconhecido ao cadastrar chamado.");
      }

      const createdTicket: Ticket = await response.json();
      setSuccessMessage(`Chamado registrado com sucesso! Código: ${createdTicket.id}`);
      
      // Clean form fields (except user login data)
      setTitle("");
      setDescription("");
      setAttachments([]);
      
      // Pass ticket to parent component
      onSuccess(createdTicket);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Falha na conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Abrir Novo Chamado de Suporte</h3>
          <p className="text-xs text-slate-500">Insira as informações correspondentes e nossa equipe responderá em breve.</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-800 text-sm rounded-xl border border-green-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-800 text-sm rounded-xl border border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">
            Empresa / Cadastro Vinculado {availableCompanies.length > 0 && <span className="text-rose-500">*</span>}
          </label>
          <select
            required={availableCompanies.length > 0}
            className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans ${availableCompanies.length <= 1 && !isAdminOrAgent ? 'cursor-not-allowed opacity-80' : ''}`}
            value={company}
            onChange={handleCompanyChange}
            disabled={availableCompanies.length <= 1 && !isAdminOrAgent}
          >
            <option value="">-- Selecione uma Empresa --</option>
            {availableCompanies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Identificação do Cliente */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Nome do Solicitante <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mariana Silva"
              className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans ${!isAdminOrAgent ? 'cursor-not-allowed opacity-80' : ''}`}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              readOnly={!isAdminOrAgent}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              E-mail de Contato <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="Ex: mariana@exemplo.com"
              className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans ${!isAdminOrAgent ? 'cursor-not-allowed opacity-80' : ''}`}
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              readOnly={!isAdminOrAgent}
            />
          </div>
        </div>

        {/* Categoria e Prioridade */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Categoria do Chamado <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
            >
              <option value="technical">🔧 Suporte Técnico / Bug</option>
              <option value="billing">💳 Cobrança, Faturamento e Planos</option>
              <option value="question">❓ Dúvidas de Uso ou Configuração</option>
              <option value="feature">💡 Sugestão de Melhoria</option>
              <option value="other">📦 Outros Assuntos</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Criticidade Estimada <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              <option value="low">🟢 Baixa (Não impede o uso diário)</option>
              <option value="medium">🔵 Média (Afecta usabilidade geral)</option>
              <option value="high">🟠 Alta (Impacto severo na produção)</option>
              <option value="urgent">🔴 Urgente (Serviço totalmente fora ou inoperante)</option>
            </select>
          </div>
        </div>

        {/* Resumo do Título */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">
            Assunto do Ticket <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Erro 500 no checkout ao usar cartão Elo"
            maxLength={120}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Descrição Detalhada */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">
            Descrição Detalhada do Problema <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            placeholder="Forneça o máximo de informações e detalhes possível (passo a passo para reproduzir o erro, comportamento esperado vs comportamento atual, navegadores onde ocorre, etc.)."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Campo de Anexos */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-semibold text-slate-700 block flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
            Anexar Arquivos (Opcional, <span className="font-bold underline text-blue-600">Max 2MB por arquivo</span>):
          </label>
          
          <div className="flex items-center gap-2">
            <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none">
              <Paperclip className="w-4 h-4 text-slate-500" />
              <span>Anexar Arquivo</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <span className="text-[10px] text-slate-400">
              {attachments.length === 0 ? "Nenhum arquivo selecionado" : `${attachments.length} arquivo(s) prontos`}
            </span>
          </div>

          {/* List pending attachments pills */}
          {attachments.length > 0 && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {attachments.map((file, idx) => (
                <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold shadow-3xs max-w-xs truncate">
                  <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{file.name}</span>
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
        </div>

        {/* Botão de Envio */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando Chamado...
              </>
            ) : (
              "Enviar Ticket de Suporte"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
