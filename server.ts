/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { Ticket, TicketCategory, TicketStatus, TicketPriority, TicketInteraction, TicketStats, SentEmail } from "./src/types";

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "tickets_db.json");
const EMAILS_DB_FILE = path.join(process.cwd(), "emails_db.json");
const CHAT_HISTORY_DB_FILE = path.join(process.cwd(), "chat_history_db.json");

import { ChatShareHistory } from "./src/types";

function readChatHistoryDatabase(): ChatShareHistory[] {
  try {
    if (!fs.existsSync(CHAT_HISTORY_DB_FILE)) {
      return [];
    }
    const data = fs.readFileSync(CHAT_HISTORY_DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco de dados de chat history", err);
    return [];
  }
}

function writeChatHistoryDatabase(history: ChatShareHistory[]) {
  try {
    fs.writeFileSync(CHAT_HISTORY_DB_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar no banco de dados de chat history", err);
  }
}

function readEmailsDatabase(): SentEmail[] {
  try {
    if (!fs.existsSync(EMAILS_DB_FILE)) {
      return [];
    }
    const data = fs.readFileSync(EMAILS_DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco de dados de emails", err);
    return [];
  }
}

function writeEmailsDatabase(emails: SentEmail[]) {
  try {
    fs.writeFileSync(EMAILS_DB_FILE, JSON.stringify(emails, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar no banco de dados de emails", err);
  }
}


// Helper and Database Functions
function readDatabase(): Ticket[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialTickets: Ticket[] = [
        {
          id: "TCK-4819",
          title: "Erro 500 ao acessar a tela de checkout",
          description: "Sempre que tento processar o pagamento com cartão de crédito na tela final do checkout, sou redirecionado para uma tela vazia com erro interno HTTP 500 do servidor. Já limpei os cookies do navegador e tentei em aba anônima, mas o erro acontece repetidamente no momento da confirmação de compra.",
          category: "technical",
          status: "in_progress",
          priority: "high",
          customerName: "Mariana Silva",
          customerEmail: "mariana.silva@exemplo.com",
          assignedAgent: "Lucas Souza",
          createdAt: "2026-06-03T10:15:22Z",
          updatedAt: "2026-06-03T13:40:10Z",
          interactions: [
            {
              id: "int-1",
              author: "Mariana Silva",
              role: "customer",
              message: "Sempre que tento processar o pagamento com cartão de crédito na tela final do checkout, sou redirecionado para uma tela vazia com erro interno HTTP 500 do servidor. Já limpei os cookies do navegador e tentei em aba anônima, mas o erro acontece repetidamente no momento da confirmação de compra.",
              createdAt: "2026-06-03T10:15:22Z"
            },
            {
              id: "int-2",
              author: "Sistema",
              role: "system",
              message: "Ticket criado com categoria Técnico e prioridade Alta. Status definido como Aberto.",
              createdAt: "2026-06-03T10:15:22Z"
            },
            {
              id: "int-3",
              author: "Lucas Souza",
              role: "agent",
              message: "Olá, Mariana! Analisei os logs do servidor e identifiquei que a falha ocorre por timeout na comunicação com o gateway de testes da operadora Elo. Estamos aplicando uma otimização no tempo de resposta para que o sistema tente uma segunda comunicação de contingência. Em instantes finalizaremos a implementação. Enquanto isso, poderia me informar qual bandeira de cartão você utilizou?",
              createdAt: "2026-06-03T11:30:00Z"
            },
            {
              id: "int-4",
              author: "Sistema",
              role: "system",
              message: "Status alterado de Aberto para Em Atendimento por Lucas Souza.",
              createdAt: "2026-06-03T11:30:00Z"
            },
            {
              id: "int-5",
              author: "Mariana Silva",
              role: "customer",
              message: "Olá, Lucas! Eu utilizei justamente um cartão de bandeira Elo. Que bom que descobriram a causa! Aguardo o aviso de vocês para tentar novamente.",
              createdAt: "2026-06-03T13:40:10Z"
            }
          ]
        },
        {
          id: "TCK-5201",
          title: "Dúvida sobre alteração de plano anual para plano mensal integrado",
          description: "Gostaria de saber se é possível migrar minha assinatura atual que está cadastrada no faturamento anual para uma cobrança mensal automática diretamente pelo painel, sem que eu perca as métricas e análises dos projetos já configurados em minha conta.",
          category: "billing",
          status: "open",
          priority: "low",
          customerName: "Roberto Mendes",
          customerEmail: "roberto@empresa.com",
          createdAt: "2026-06-04T09:12:00Z",
          updatedAt: "2026-06-04T09:12:00Z",
          interactions: [
            {
              id: "int-6",
              author: "Roberto Mendes",
              role: "customer",
              message: "Gostaria de saber se é possível migrar minha assinatura atual que está cadastrada no faturamento anual para uma cobrança mensal automática diretamente pelo painel, sem que eu perca as métricas e análises dos projetos já configurados em minha conta.",
              createdAt: "2026-06-04T09:12:00Z"
            },
            {
              id: "int-7",
              author: "Sistema",
              role: "system",
              message: "Ticket criado com categoria Financeiro e prioridade Baixa. Status definido como Aberto.",
              createdAt: "2026-06-04T09:12:00Z"
            }
          ]
        },
        {
          id: "TCK-2940",
          title: "Sugestão: Botão para exportação de relatórios em PDF/CSV",
          description: "Nossa equipe utiliza muito os relatórios gerados pelo dashboard de performance. Facilitaria muito se pudessem adicionar um recurso para exportar as planilhas e gráficos diretamente em arquivo CSV ou relatório PDF consolidado. Isso nos economizaria muito tempo de tabulação manual de dados.",
          category: "feature",
          status: "solved",
          priority: "medium",
          customerName: "Beatriz Ribeiro",
          customerEmail: "beatriz.ribeiro@growth.tech",
          assignedAgent: "Aline Santos",
          createdAt: "2026-06-01T14:22:00Z",
          updatedAt: "2026-06-02T16:05:00Z",
          interactions: [
            {
              id: "int-8",
              author: "Beatriz Ribeiro",
              role: "customer",
              message: "Nossa equipe utiliza muito os relatórios gerados pelo dashboard de performance. Facilitaria muito se pudessem adicionar um recurso para exportar as planilhas e gráficos diretamente em arquivo CSV ou relatório PDF consolidado. Isso nos economizaria muito tempo de tabulação manual de dados.",
              createdAt: "2026-06-01T14:22:00Z"
            },
            {
              id: "int-9",
              author: "Sistema",
              role: "system",
              message: "Ticket criado com categoria Sugestão e prioridade Média. Status definido como Aberto.",
              createdAt: "2026-06-01T14:22:00Z"
            },
            {
              id: "int-10",
              author: "Aline Santos",
              role: "agent",
              message: "Olá, Beatriz! Tudo bem? Excelente sugestão. Tenho uma ótima notícia para você: acabamos de disponibilizar a exportação direta em formato CSV em nosso último update! Você pode acessar clicando no menu suspenso de três pontos no canto superior de cada widget do gráfico. A exportação consolidada em PDF já está no planejamento do nosso time para o próximo trimestre. Espero que isso já ajude seu time de Growth!",
              createdAt: "2026-06-02T15:50:00Z"
            },
            {
              id: "int-11",
              author: "Sistema",
              role: "system",
              message: "Status alterado de Aberto para Em Atendimento por Aline Santos.",
              createdAt: "2026-06-02T15:50:00Z"
            },
            {
              id: "int-12",
              author: "Beatriz Ribeiro",
              role: "customer",
              message: "Nossa, que maravilhoso! Testei aqui e funcionou perfeitamente. Vai poupar horas de trabalho do nosso time. Muito obrigada pela agilidade e pelo excelente suporte de sempre!",
              createdAt: "2026-06-02T16:00:00Z"
            },
            {
              id: "int-13",
              author: "Aline Santos",
              role: "agent",
              message: "Fico extremamente feliz em ajudar, Beatriz! Vou marcar este ticket como Resolvido. Qualquer nova sugestão ou problema, pode abrir um novo chamado. Tenha uma excelente semana!",
              createdAt: "2026-06-02T16:04:30Z"
            },
            {
              id: "int-14",
              author: "Sistema",
              role: "system",
              message: "Status alterado de Em Atendimento para Resolvido por Aline Santos.",
              createdAt: "2026-06-02T16:05:00Z"
            }
          ]
        },
        {
          id: "TCK-9921",
          title: "Incompatibilidade de layout com Safari iOS",
          description: "O menu lateral do painel do cliente fica cortado ou empurrado para baixo quando acessado pelo navegador Safari em iPhones com tela menor (especialmente o SE e modelos Mini). Os botões de ação do topo do dashboard também não estão clicáveis.",
          category: "technical",
          status: "closed",
          priority: "urgent",
          customerName: "Carlos Drumond",
          customerEmail: "carlos@drumond.adv.br",
          assignedAgent: "Lucas Souza",
          createdAt: "2026-05-30T08:00:00Z",
          updatedAt: "2026-05-31T09:45:00Z",
          interactions: [
            {
              id: "int-15",
              author: "Carlos Drumond",
              role: "customer",
              message: "O menu lateral do painel do cliente fica cortado ou empurrado para baixo quando acessado pelo navegador Safari em iPhones com tela menor (especialmente o SE e modelos Mini). Os botões de ação do topo do dashboard também não estão clicáveis.",
              createdAt: "2026-05-30T08:00:00Z"
            },
            {
              id: "int-16",
              author: "Sistema",
              role: "system",
              message: "Ticket criado com categoria Técnico e prioridade Urgente. Status definido como Aberto.",
              createdAt: "2026-05-30T08:00:00Z"
            },
            {
              id: "int-17",
              author: "Sistema",
              role: "system",
              message: "Ticket atribuído a Lucas Souza com prioridade Urgente.",
              createdAt: "2026-05-30T08:05:00Z"
            },
            {
              id: "int-18",
              author: "Lucas Souza",
              role: "agent",
              message: "Prezado Carlos, identificamos o problema relacionado ao flexbox e viewport customizado que o Safari do iOS interpretava incorretamente. Lançamos uma nova folha de estilo responsiva para dispositivos abaixo de 375px de largura. A correção foi posta em produção nesta madrugada.",
              createdAt: "2026-05-31T09:30:00Z"
            },
            {
              id: "int-19",
              author: "Sistema",
              role: "system",
              message: "Status alterado de Aberto para Em Atendimento por Lucas Souza.",
              createdAt: "2026-05-31T09:30:00Z"
            },
            {
              id: "int-20",
              author: "Sistema",
              role: "system",
              message: "Status alterado de Em Atendimento para Resolvido automaticamente por inatividade ou fechamento pelo agente.",
              createdAt: "2026-05-31T09:40:00Z"
            },
            {
              id: "int-21",
              author: "Sistema",
              role: "system",
              message: "Ticket marcado como Fechado de forma definitiva.",
              createdAt: "2026-05-31T09:45:00Z"
            }
          ]
        }
      ];
      writeDatabase(initialTickets);
      return initialTickets;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco de dados de tickets", err);
    return [];
  }
}

function writeDatabase(tickets: Ticket[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(tickets, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar no banco de dados de tickets", err);
  }
}

// REST Api Endpoints

// 1. Get all tickets (supports queries)
app.get("/api/tickets", (req, res) => {
  const tickets = readDatabase();
  const { email, status, priority, category, search } = req.query;

  let filtered = [...tickets];

  if (email) {
    const emailStr = String(email).toLowerCase().trim();
    filtered = filtered.filter(t => t.customerEmail.toLowerCase().includes(emailStr));
  }

  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }

  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }

  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    filtered = filtered.filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q)
    );
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// 2. Fetch one ticket (with detailed id matching)
app.get("/api/tickets/:id", (req, res) => {
  const tickets = readDatabase();
  const ticket = tickets.find(t => t.id === req.params.id);

  if (!ticket) {
    res.status(404).json({ error: "Ticket não localizado em nosso banco de dados." });
    return;
  }

  res.json(ticket);
});

// 3. Create active support ticket
app.post("/api/tickets", (req, res) => {
  const { title, description, category, priority, customerName, customerEmail, company, attachments } = req.body;

  if (!title || !description || !category || !priority || !customerName || !customerEmail) {
    res.status(400).json({ error: "Parâmetros obrigatórios de cadastro ausentes." });
    return;
  }

  const tickets = readDatabase();
  
  // Generating ticket short Code TCK-XXXX
  let codeNum = Math.floor(1000 + Math.random() * 9000);
  let ticketId = `TCK-${codeNum}`;
  while (tickets.some(t => t.id === ticketId)) {
    codeNum = Math.floor(1000 + Math.random() * 9000);
    ticketId = `TCK-${codeNum}`;
  }

  const now = new Date().toISOString();
  const newTicket: Ticket = {
    id: ticketId,
    title,
    description,
    category,
    status: "open",
    priority,
    customerName,
    customerEmail,
    company: company || "",
    createdAt: now,
    updatedAt: now,
    attachments: attachments || [],
    interactions: [
      {
        id: `int-${Math.random().toString(36).substring(2, 9)}`,
        author: customerName,
        role: "customer",
        message: description,
        createdAt: now,
        attachments: attachments || []
      },
      {
        id: `int-${Math.random().toString(36).substring(2, 9)}`,
        author: "Sistema",
        role: "system",
        message: `Ticket criado com categoria ${getCategoryLabel(category)} e prioridade ${getPriorityLabel(priority)}. Status definido como Aberto.`,
        createdAt: now,
      }
    ]
  };

  tickets.unshift(newTicket);
  writeDatabase(tickets);

  // Auto-register client profile access securely if not already registered
  try {
    const agents = readAgentsDatabase();
    const emailNorm = customerEmail.toLowerCase().trim();
    const alreadyExists = agents.some(a => a.email.toLowerCase() === emailNorm);
    if (!alreadyExists) {
      agents.push({
        name: customerName,
        email: emailNorm,
        profile: "cliente",
        password: "" // Empty or optional password for customers
      });
      writeAgentsDatabase(agents);
      
      // Add a system log inside the interaction list of the ticket
      const sysLogTime = new Date().toISOString();
      newTicket.interactions.push({
        id: `system-reg-${Math.random().toString(36).substring(2, 9)}`,
        author: "Sistema",
        role: "system",
        message: `Novo cliente identificado. Acesso automático cadastrado com sucesso para o e-mail: ${customerEmail}.`,
        createdAt: sysLogTime
      });
      // Save tickets again with this registration system message
      writeDatabase(tickets);
    }
  } catch (err) {
    console.error("Falha ao registrar cliente automaticamente:", err);
  }

  res.status(201).json(newTicket);
});

// 4. Update ticket details (restricted to staff status alteration and assignment)
app.patch("/api/tickets/:id", async (req, res) => {
  const requesterEmail = req.headers["x-agent-email"] as string;
  const { status, priority, assignedAgent, agentName } = req.body;

  const tickets = readDatabase();
  const index = tickets.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Ticket não localizado para alteração." });
    return;
  }

  const ticket = tickets[index];

  // Specific rule: Customers can finalize (status: "closed") their own tickets
  const isOwner = requesterEmail && ticket.customerEmail.toLowerCase().trim() === requesterEmail.toLowerCase().trim();
  const isCustomerFinalizing = isOwner && status === "closed";

  if (!isCustomerFinalizing) {
    if (!checkPermission(req, res, "update_tickets")) return;
  }

  const now = new Date().toISOString();
  const actor = agentName || (isCustomerFinalizing ? "Cliente" : "Atendente");

  // Check state transitions or details to generate system logs
  if (status && status !== ticket.status) {
    const oldStatusLabel = getStatusLabel(ticket.status);
    const newStatusLabel = getStatusLabel(status);
    
    ticket.interactions.push({
      id: `system-${Math.random().toString(36).substring(2, 9)}`,
      author: "Sistema",
      role: "system",
      message: `Status alterado de "${oldStatusLabel}" para "${newStatusLabel}" por ${actor}.`,
      createdAt: now
    });

    // Fire actual SMTP delivery or Simulated flow
    // Temporarily update status to let template render with correct target styles
    const prevStatus = ticket.status;
    ticket.status = status;
    
    const emailResult = await sendNotificationEmail(
      ticket.id,
      ticket.customerName,
      ticket.customerEmail,
      `Central de Suporte: Atualização do seu Chamado ${ticket.id} para ${newStatusLabel}`,
      generateStatusHtml(ticket, oldStatusLabel, newStatusLabel)
    );

    // Restore previous status just in case, but actually we set it permanent below
    ticket.status = status;

    let emailMsg = `✉️ Notificação enviada para ${ticket.customerEmail} (Status: ${newStatusLabel}).`;
    if (emailResult.status === "sent") {
      emailMsg = `✉️ Notificação enviada com sucesso via SMTP para ${ticket.customerEmail}.`;
    } else if (emailResult.status === "failed") {
      emailMsg = `❌ Falha ao tentar disparar e-mail via SMTP para ${ticket.customerEmail} (Status: ${newStatusLabel}): ${emailResult.error}`;
    } else if (emailResult.status === "simulated") {
      emailMsg = `✉️ Notificação enviada (Simulação) para ${ticket.customerEmail} (Status: ${newStatusLabel}).`;
    }

    ticket.interactions.push({
      id: `email-${Math.random().toString(36).substring(2, 9)}`,
      author: "Notificação por E-mail",
      role: "system",
      message: emailMsg,
      createdAt: now
    });
  }

  if (priority && priority !== ticket.priority) {
    const oldLabel = getPriorityLabel(ticket.priority);
    const newLabel = getPriorityLabel(priority);
    ticket.interactions.push({
      id: `system-${Math.random().toString(36).substring(2, 9)}`,
      author: "Sistema",
      role: "system",
      message: `Prioridade alterada de "${oldLabel}" para "${newLabel}" por ${actor}.`,
      createdAt: now
    });
    ticket.priority = priority;
  }

  if (assignedAgent !== undefined && assignedAgent !== ticket.assignedAgent) {
    const prevAgent = ticket.assignedAgent || "Ninguém";
    const nextAgent = assignedAgent || "Ninguém";
    ticket.interactions.push({
      id: `system-${Math.random().toString(36).substring(2, 9)}`,
      author: "Sistema",
      role: "system",
      message: `Atendente alterado de "${prevAgent}" para "${nextAgent}".`,
      createdAt: now
    });
    ticket.assignedAgent = assignedAgent || undefined;
  }

  ticket.updatedAt = now;
  tickets[index] = ticket;
  writeDatabase(tickets);

  res.json(ticket);
});

// 5. Add communication reply / message to timeline
app.post("/api/tickets/:id/interactions", async (req, res) => {
  const requesterEmail = req.headers["x-agent-email"] as string;
  const { author, role, message, attachments } = req.body;

  if (!author || !role || !message) {
    res.status(400).json({ error: "Parâmetros de mensagem inválidos ou em falta." });
    return;
  }

  const tickets = readDatabase();
  const index = tickets.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Ticket não localizado." });
    return;
  }

  const ticket = tickets[index];

  // Specific rule: Customers can comment on their OWN tickets
  const isOwner = requesterEmail && ticket.customerEmail.toLowerCase().trim() === requesterEmail.toLowerCase().trim();
  const isCustomerResponding = isOwner && role === "customer";

  if (!isCustomerResponding) {
    if (!checkPermission(req, res, "respond_tickets")) return;
  }

  // Restrict customer comments to open or in_progress tickets only
  if (role === "customer" && ticket.status !== "open" && ticket.status !== "in_progress") {
    res.status(400).json({ error: "Clientes podem enviar comentários apenas em chamados com status 'Aberto' ou 'Em Atendimento'." });
    return;
  }

  const now = new Date().toISOString();

  const newInteraction: TicketInteraction = {
    id: `msg-${Math.random().toString(36).substring(2, 9)}`,
    author,
    role,
    message,
    attachments: attachments || [],
    createdAt: now
  };

  // If customer replies and ticket was solved, reopen it or status auto update
  if (role === "customer" && (ticket.status === "solved" || ticket.status === "closed")) {
    const originalStatus = ticket.status;
    const oldStatusLabel = getStatusLabel(originalStatus);
    const newStatusLabel = getStatusLabel('in_progress');
    
    ticket.status = "in_progress";
    ticket.interactions.push({
      id: `system-${Math.random().toString(36).substring(2, 9)}`,
      author: "Sistema",
      role: "system",
      message: `Ticket reaberto automaticamente ("${oldStatusLabel}" para "${newStatusLabel}") após nova resposta do cliente.`,
      createdAt: now
    });

    // Fire actual SMTP delivery or Simulated flow
    const emailResult = await sendNotificationEmail(
      ticket.id,
      ticket.customerName,
      ticket.customerEmail,
      `Central de Suporte: Reabertura Automática do seu Chamado ${ticket.id}`,
      generateStatusHtml(ticket, oldStatusLabel, newStatusLabel)
    );

    let emailMsg = `✉️ E-mail enviado para ${ticket.customerEmail} notificando a reabertura do chamado (Em Atendimento).`;
    if (emailResult.status === "sent") {
      emailMsg = `✉️ Notificação de reabertura enviada com sucesso via SMTP para ${ticket.customerEmail}.`;
    } else if (emailResult.status === "failed") {
      emailMsg = `❌ Falha ao tentar disparar e-mail via SMTP para ${ticket.customerEmail} (Reabertura): ${emailResult.error}`;
    } else if (emailResult.status === "simulated") {
      emailMsg = `✉️ Notificação de reabertura enviada (Simulação) para ${ticket.customerEmail}.`;
    }

    ticket.interactions.push({
      id: `email-${Math.random().toString(36).substring(2, 9)}`,
      author: "Notificação por E-mail",
      role: "system",
      message: emailMsg,
      createdAt: now
    });
  }

  ticket.interactions.push(newInteraction);
  ticket.updatedAt = now;
  tickets[index] = ticket;
  writeDatabase(tickets);

  res.status(201).json(ticket);
});

// 6. Delete critical ticket (cleanup and management)
app.delete("/api/tickets/:id", (req, res) => {
  if (!checkPermission(req, res, "delete_tickets")) return;
  const tickets = readDatabase();
  const filtered = tickets.filter(t => t.id !== req.params.id);

  if (tickets.length === filtered.length) {
    res.status(404).json({ error: "Ticket não localizado." });
    return;
  }

  writeDatabase(filtered);
  res.json({ success: true, message: `Ticket ${req.params.id} excluído com sucesso.` });
});

// 7. Get dashboard aggregated performance statistics
app.get("/api/stats", (req, res) => {
  const tickets = readDatabase();

  const stats: TicketStats = {
    total: tickets.length,
    open: 0,
    inProgress: 0,
    solved: 0,
    closed: 0,
    byCategory: { technical: 0, billing: 0, question: 0, feature: 0, other: 0 },
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 }
  };

  tickets.forEach(t => {
    // Status counts
    if (t.status === "open") stats.open++;
    else if (t.status === "in_progress") stats.inProgress++;
    else if (t.status === "solved") stats.solved++;
    else if (t.status === "closed") stats.closed++;

    // Category counts
    if (t.category in stats.byCategory) {
      stats.byCategory[t.category]++;
    } else {
      stats.byCategory[t.category] = 1;
    }

    // Priority counts
    if (t.priority in stats.byPriority) {
      stats.byPriority[t.priority]++;
    } else {
      stats.byPriority[t.priority] = 1;
    }
  });

  res.json(stats);
});

// Helpers for Status Labels
function getCategoryLabel(category: TicketCategory): string {
  const labels: Record<TicketCategory, string> = {
    technical: "Técnico",
    billing: "Financeiro",
    question: "Dúvida",
    feature: "Sugestão",
    other: "Outro"
  };
  return labels[category] || category;
}

function getPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente"
  };
  return labels[priority] || priority;
}

function getStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    open: "Aberto",
    in_progress: "Em Atendimento",
    solved: "Resolvido",
    closed: "Fechado"
  };
  return labels[status] || status;
}

// Reusable elegant HTML template for Ticket Status email notifications
function generateStatusHtml(ticket: Ticket, oldStatusLabel: string, newStatusLabel: string): string {
  let accentColor = "#2563eb"; // Blue 600 default
  if (ticket.status === "in_progress") accentColor = "#0284c7"; // Sky 600
  else if (ticket.status === "solved") accentColor = "#059669"; // Emerald 600
  else if (ticket.status === "closed") accentColor = "#4b5563"; // Gray 600

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificação de Chamado: ${ticket.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .card { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .header { background: ${accentColor}; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .status-badge { display: inline-block; background: ${accentColor}10; color: ${accentColor}; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 99px; border: 1px solid ${accentColor}30; margin: 12px 0; text-transform: uppercase; }
    .details-box { background: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #f1f5f9; }
    .details-row { display: flex; margin-bottom: 8px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 8px; }
    .details-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
    .details-label { width: 100px; font-weight: 700; font-size: 10px; text-transform: uppercase; color: #64748b; tracking-wider; }
    .details-value { flex: 1; font-size: 12px; color: #334155; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }
    .button-link { display: inline-block; background: ${accentColor}; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 12px; padding: 10px 20px; border-radius: 8px; margin-top: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-transform: uppercase; tracking-wider; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Central de Atendimento ao Cliente</h1>
      <p>Notificação de Atualização de Chamado</p>
    </div>
    <div class="content">
      <p>Olá, <strong>${ticket.customerName}</strong>,</p>
      <p>Para manter você por dentro do seu atendimento, nosso sistema identificou uma atualização do seu chamado criado via integração com WhatsApp:</p>
      
      <div style="text-align: center;">
        <div class="status-badge">
          Status: ${oldStatusLabel} ➔ ${newStatusLabel}
        </div>
      </div>
      
      <div class="details-box">
        <div class="details-row">
          <div class="details-label">Protocolo</div>
          <div class="details-value"><b>${ticket.id}</b></div>
        </div>
        <div class="details-row">
          <div class="details-label">Assunto</div>
          <div class="details-value">${ticket.title}</div>
        </div>
        <div class="details-row">
          <div class="details-label">Categoria</div>
          <div class="details-value">${getCategoryLabel(ticket.category)}</div>
        </div>
        <div class="details-row">
          <div class="details-label">Prioridade</div>
          <div class="details-value">${getPriorityLabel(ticket.priority)}</div>
        </div>
      </div>

      <p>Caso deseje interagir com o analista encarregado do caso ou anexar novos documentos/esclarecimentos, você poderá visualizar o histórico consolidado clicando no link abaixo:</p>

      <div style="text-align: center;">
        <a href="${process.env.APP_URL || 'https://ai.studio/build'}" class="button-link" target="_blank">Acessar Área do Cliente</a>
      </div>
    </div>
    <div class="footer">
      <p>Este e-mail é disparado por um sistema automatizado de atendimento ao cliente por WhatsApp e E-mail. Por favor, não responda diretamente a este e-mail.</p>
      <p>© 2026 Central de Atendimento. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

// Service to handle sending real notification emails with automated sandbox fallback
async function sendNotificationEmail(
  ticketId: string,
  recipientName: string,
  recipientEmail: string,
  subject: string,
  bodyHtml: string
): Promise<{ status: "sent" | "failed" | "simulated"; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "suporte@suaempresa.com";

  const emailId = `eml-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  // If credentials are empty, run as Simulated Sandbox for the user's preview and log to emails_db.json
  const isConfigured = !!(host && user && pass);

  if (!isConfigured) {
    const emailRecord: SentEmail = {
      id: emailId,
      ticketId,
      recipientEmail,
      recipientName,
      subject,
      bodyHtml,
      status: "simulated",
      createdAt: now
    };
    const emailsList = readEmailsDatabase();
    emailsList.unshift(emailRecord);
    writeEmailsDatabase(emailsList);

    console.log(`[Email Simulator] Simulating status notification for ${ticketId} to ${recipientEmail}`);
    return { status: "simulated" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 15000,   // 15 seconds
      socketTimeout: 30000,     // 30 seconds
      tls: {
        rejectUnauthorized: false // Bypasses self-signed certificate constraints for internal SMTP gateways
      }
    });

    await transporter.sendMail({
      from,
      to: recipientEmail,
      subject,
      html: bodyHtml
    });

    const emailRecord: SentEmail = {
      id: emailId,
      ticketId,
      recipientEmail,
      recipientName,
      subject,
      bodyHtml,
      status: "sent",
      createdAt: now
    };
    const emailsList = readEmailsDatabase();
    emailsList.unshift(emailRecord);
    writeEmailsDatabase(emailsList);

    console.log(`[Email dispatch] Sent real status update email ${emailId} via SMTP to ${recipientEmail}`);
    return { status: "sent" };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const emailRecord: SentEmail = {
      id: emailId,
      ticketId,
      recipientEmail,
      recipientName,
      subject,
      bodyHtml,
      status: "failed",
      error: errorMsg,
      createdAt: now
    };
    const emailsList = readEmailsDatabase();
    emailsList.unshift(emailRecord);
    writeEmailsDatabase(emailsList);

    console.error(`[Email dispatch] SMTP delivery failed to ${recipientEmail}:`, errorMsg);
    return { status: "failed", error: errorMsg };
  }
}

// Endpoint to audit email dispatch logs
app.get("/api/emails", (req, res) => {
  if (!checkPermission(req, res, "view_outbox")) return;
  const emails = readEmailsDatabase();
  res.json(emails);
});

// Endpoint to send a system diagnostic test email
app.post("/api/emails/test", async (req, res) => {
  if (!checkPermission(req, res, "view_outbox")) return;
  const { toEmail, toName } = req.body;
  if (!toEmail) {
    res.status(400).json({ error: "O e-mail de destino é obrigatório para enviar o teste." });
    return;
  }

  const recipientName = toName || "Parceiro de Teste";
  const recipientEmail = toEmail;
  const subject = "🧪 Central de Suporte: Teste de Conexão SMTP / Sandbox";
  const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  const bodyHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste de Entrega de E-mail de Suporte</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .card { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .header { background: #2563eb; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .badge { display: inline-block; background: #22c55e15; color: #15803d; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 99px; border: 1px solid #22c55e30; margin: 12px 0; text-transform: uppercase; }
    .badge-simulated { display: inline-block; background: #3b82f615; color: #1d4ed8; font-weight: 700; font-size: 11px; padding: 6px 14px; border-radius: 99px; border: 1px solid #3b82f630; margin: 12px 0; text-transform: uppercase; }
    .details-box { background: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #f1f5f9; }
    .details-row { display: flex; margin-bottom: 8px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 8px; }
    .details-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
    .details-label { width: 120px; font-weight: 700; font-size: 10px; text-transform: uppercase; color: #64748b; }
    .details-value { flex: 1; font-size: 12px; color: #334155; font-family: monospace; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header" style="background: ${hasSmtpConfig ? '#059669' : '#2563eb'}">
      <h1>🧪 Diagnóstico de Sistema</h1>
      <p>Notificação de Validação SMTP & Entrega de E-mails</p>
    </div>
    <div class="content">
      <p>Olá, <strong>${recipientName}</strong>,</p>
      <p>Este é um disparo voluntário de homologação solicitada através do Painel de Suporte para auditar a saúde da configuração de saída de e-mails em seu servidor.</p>
      
      <div style="text-align: center;">
        ${hasSmtpConfig ? `
          <div class="badge">
            ✔️ SMTP Ativo (Em Produção)
          </div>
        ` : `
          <div class="badge-simulated">
            ⏱️ Modo de Simulação Ativo (Sandbox)
          </div>
        `}
      </div>
      
      <div class="details-box">
        <div class="details-row">
          <div class="details-label">Provedor SMTP</div>
          <div class="details-value">${process.env.SMTP_HOST || "Simulador Interno Ativo / Sem Credenciais"}</div>
        </div>
        <div class="details-row">
          <div class="details-label">Porta Conexão</div>
          <div class="details-value">${process.env.SMTP_PORT || "587 (Padrão)"}</div>
        </div>
        <div class="details-row">
          <div class="details-label">Usuário SMTP</div>
          <div class="details-value">${process.env.SMTP_USER || "Não Declarado"}</div>
        </div>
        <div class="details-row">
          <div class="details-label">Remetente</div>
          <div class="details-value">${process.env.SMTP_FROM || "suporte@suaempresa.com"}</div>
        </div>
      </div>

      <p>Se as credenciais estiverem corretas no seu arquivo <code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">.env.example</code> (ou preenchidas nas Configurações do AI Studio), esta mensagem confirma a plena integridade da entrega em tempo real.</p>
    </div>
    <div class="footer">
      <p>Este e-mail é gerado por solicitação do administrador do Painel de Suporte. Não responda diretamente.</p>
      <p>© 2026 Central de Atendimento. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

  const emailResult = await sendNotificationEmail(
    "TCK-TEST",
    recipientName,
    recipientEmail,
    subject,
    bodyHtml
  );

  res.json({
    success: emailResult.status === "sent" || emailResult.status === "simulated",
    status: emailResult.status,
    error: emailResult.error,
    smtpHost: process.env.SMTP_HOST || null,
    isConfigured: hasSmtpConfig
  });
});

// Endpoint to resend an email from the audit logs
app.post("/api/emails/:id/resend", async (req, res) => {
  if (!checkPermission(req, res, "resend_emails")) return;

  const { id } = req.params;
  const emails = readEmailsDatabase();
  const emailOriginal = emails.find(e => e.id === id);

  if (!emailOriginal) {
    res.status(404).json({ error: "E-mail não localizado no banco de dados de auditoria." });
    return;
  }

  // Highlight it is a re-sent email
  const cleanSubject = emailOriginal.subject.replace(/^\[REENVIO\]\s*/i, "");
  const newSubject = `[REENVIO] ${cleanSubject}`;

  const emailResult = await sendNotificationEmail(
    emailOriginal.ticketId,
    emailOriginal.recipientName,
    emailOriginal.recipientEmail,
    newSubject,
    emailOriginal.bodyHtml
  );

  res.json({
    success: emailResult.status === "sent" || emailResult.status === "simulated",
    status: emailResult.status,
    error: emailResult.error
  });
});

// JSON databases for Users/Agents and Profile Permissions
const AGENTS_DB_FILE = path.join(process.cwd(), "agents_db.json");
const PERMISSIONS_DB_FILE = path.join(process.cwd(), "permissions_db.json");

interface Agent {
  name: string;
  email: string;
  password?: string;
  profile: "administrador" | "tecnico" | "cliente";
  phone?: string;
  company?: string;
  role?: string;
}

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

const DEFAULT_PERMISSIONS: PermissionsConfig = {
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

function readAgentsDatabase(): Agent[] {
  try {
    if (!fs.existsSync(AGENTS_DB_FILE)) {
      const defaultAgents: Agent[] = [
        { name: "Suporte Master", email: "suporte@prestativaautomacao.com.br", password: "Sen135h@", profile: "administrador" },
        { name: "Lucas Souza", email: "lucas.souza@suporte.com", password: "suporte123", profile: "tecnico" },
        { name: "Aline Santos", email: "aline.santos@suporte.com", password: "suporte123", profile: "administrador" },
        { name: "Mariana Silva", email: "mariana.silva@exemplo.com", password: "", profile: "cliente" }
      ];
      fs.writeFileSync(AGENTS_DB_FILE, JSON.stringify(defaultAgents, null, 2), "utf-8");
      return defaultAgents;
    }
    const data = fs.readFileSync(AGENTS_DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco de dados de agentes", err);
    return [];
  }
}

function writeAgentsDatabase(agents: Agent[]) {
  try {
    fs.writeFileSync(AGENTS_DB_FILE, JSON.stringify(agents, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar banco de dados de agentes", err);
  }
}

function readPermissionsDatabase(): PermissionsConfig {
  try {
    if (!fs.existsSync(PERMISSIONS_DB_FILE)) {
      fs.writeFileSync(PERMISSIONS_DB_FILE, JSON.stringify(DEFAULT_PERMISSIONS, null, 2), "utf-8");
      return DEFAULT_PERMISSIONS;
    }
    const data = fs.readFileSync(PERMISSIONS_DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco de dados de permissões", err);
    return DEFAULT_PERMISSIONS;
  }
}

function writePermissionsDatabase(perms: PermissionsConfig) {
  try {
    fs.writeFileSync(PERMISSIONS_DB_FILE, JSON.stringify(perms, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar banco de dados de permissões", err);
  }
}

// Active Permission Check helper
function checkPermission(req: express.Request, res: express.Response, permissionName: keyof ProfilePermissions): boolean {
  const agentEmail = req.headers["x-agent-email"] as string;
  if (!agentEmail) {
    // If no master/agent header is provided, let client requests slide (which shouldn't have headers)
    return true;
  }

  const agents = readAgentsDatabase();
  const agent = agents.find(a => a.email.toLowerCase() === agentEmail.toLowerCase().trim());
  if (!agent) {
    res.status(401).json({ error: "Sessão de suporte expirada ou agente não cadastrado." });
    return false;
  }

  const perms = readPermissionsDatabase();
  const profile = agent.profile || "cliente";
  const hasAccess = perms[profile] ? perms[profile][permissionName] : false;

  if (!hasAccess) {
    res.status(403).json({
      error: `Seu perfil de [${profile.toUpperCase()}] não possui permissão para executar esta ação (${permissionName}). Solicite permissão ao administrador master.`
    });
    return false;
  }

  return true;
}

// API Endpoints for Acessos and Perfis Configuration

// Get only assignable analysts (administrador or tecnico) for tickets assignment
app.get("/api/analysts", (req, res) => {
  const agents = readAgentsDatabase();
  const assignable = agents.filter(a => a.profile === "administrador" || a.profile === "tecnico");
  const filtered = assignable.map(a => ({
    name: a.name,
    email: a.email,
    profile: a.profile
  }));
  res.json(filtered);
});

// A. Get list of accesses/agents
app.get("/api/companies", (req, res) => {
  const agents = readAgentsDatabase();
  const emailFilter = req.query.email ? (req.query.email as string).toLowerCase().trim() : null;

  const companiesData: Record<string, {name: string, email: string}[]> = {};
  
  agents.forEach(a => {
    if (a.company) {
      if (emailFilter && a.email.toLowerCase().trim() !== emailFilter) {
        return; // skip if filtering by email and it doesn't match
      }
      if (!companiesData[a.company]) {
        companiesData[a.company] = [];
      }
      companiesData[a.company].push({ name: a.name, email: a.email });
    }
  });

  const companies = Object.keys(companiesData);
  res.json({ companies, companyContacts: companiesData });
});

app.get("/api/agents", (req, res) => {
  if (!checkPermission(req, res, "manage_access")) return;
  const agents = readAgentsDatabase();
  // Return without actual passwords, just masking them for security/display purposes
  const safeAgents = agents.map(a => ({
    name: a.name,
    email: a.email,
    profile: a.profile,
    password: a.password ? "••••••••" : "",
    phone: a.phone || "",
    company: a.company || "",
    role: a.role || ""
  }));
  res.json(safeAgents);
});

// B. Save a new access login
app.post("/api/agents", (req, res) => {
  if (!checkPermission(req, res, "manage_access")) return;
  const { name, email, password, profile, phone, company, role } = req.body;

  if (!name || !email || !profile) {
    res.status(400).json({ error: "Nome, e-mail e perfil são campos de preenchimento obrigatório para o cadastro." });
    return;
  }

  if (profile !== "cliente" && !password) {
    res.status(400).json({ error: "Senha é obrigatória para o perfil de operador selecionado (Administrador ou Técnico)." });
    return;
  }

  const validProfiles = ["administrador", "tecnico", "cliente"];
  if (!validProfiles.includes(profile)) {
    res.status(400).json({ error: "Perfil de acesso inválido selecionado." });
    return;
  }

  const agents = readAgentsDatabase();
  const alreadyExists = agents.some(a => a.email.toLowerCase() === email.toLowerCase().trim() && (a.company || "") === (company || ""));

  if (alreadyExists) {
    res.status(400).json({ error: "Já existe um usuário cadastrado com este endereço de e-mail e empresa." });
    return;
  }

  const newAgent: Agent = {
    name,
    email: email.toLowerCase().trim(),
    password: profile === "cliente" ? "" : password,
    profile,
    phone: phone || "",
    company: company || "",
    role: role || ""
  };

  agents.push(newAgent);
  writeAgentsDatabase(agents);

  res.json({ success: true, message: "Usuário cadastrado com sucesso!" });
});

// F. Update an existing user registration
app.put("/api/agents/:email", (req, res) => {
  if (!checkPermission(req, res, "manage_access")) return;
  const targetEmail = req.params.email.toLowerCase().trim();
  const { name, email, password, profile, phone, company, role } = req.body;

  if (!name || !email || !profile) {
    res.status(400).json({ error: "Nome, e-mail e perfil são campos obrigatórios." });
    return;
  }

  if (profile !== "cliente" && !password) {
    res.status(400).json({ error: "Senha de acesso é obrigatória para perfis Administrativos ou Técnicos." });
    return;
  }

  const agents = readAgentsDatabase();
  const index = agents.findIndex(a => a.email.toLowerCase() === targetEmail);

  if (index === -1) {
    res.status(404).json({ error: "Usuário não localizado para alteração." });
    return;
  }

  // Prevent modifying the email of support master
  if (targetEmail === "suporte@prestativaautomacao.com.br" && email.toLowerCase().trim() !== "suporte@prestativaautomacao.com.br") {
    res.status(400).json({ error: "Não é permitido alterar o e-mail do Administrador Master." });
    return;
  }

  // Check email conflict
  const newEmailNorm = email.toLowerCase().trim();
  if (newEmailNorm !== targetEmail) {
    const exists = agents.some(a => a.email.toLowerCase() === newEmailNorm);
    if (exists) {
      res.status(400).json({ error: "Já existe outro usuário cadastrado com o e-mail informado." });
      return;
    }
  }

  // Update properties
  agents[index].name = name;
  agents[index].email = newEmailNorm;
  agents[index].profile = profile;
  agents[index].phone = phone || "";
  agents[index].company = company || "";
  agents[index].role = role || "";

  if (profile === "cliente") {
    agents[index].password = "";
  } else if (password !== "••••••••") {
    agents[index].password = password;
  }

  writeAgentsDatabase(agents);
  res.json({ success: true, message: "Cadastro do usuário atualizado com sucesso!" });
});

// C. Delete an access login
app.delete("/api/agents/:email", (req, res) => {
  if (!checkPermission(req, res, "manage_access")) return;
  const emailToDelete = req.params.email;

  if (emailToDelete.toLowerCase() === "suporte@prestativaautomacao.com.br") {
    res.status(400).json({ error: "Não é permitido excluir o usuário Administrador Master padrão do sistema." });
    return;
  }

  const agents = readAgentsDatabase();
  const filtered = agents.filter(a => a.email.toLowerCase() !== emailToDelete.toLowerCase().trim());

  if (agents.length === filtered.length) {
    res.status(404).json({ error: "Usuário não localizado para exclusão." });
    return;
  }

  writeAgentsDatabase(filtered);
  res.json({ success: true, message: "Acesso de usuário excluído com sucesso." });
});

// D. Get Permissions configurations
app.get("/api/permissions", (req, res) => {
  const agentEmail = req.headers["x-agent-email"] as string;
  if (agentEmail?.toLowerCase().trim() !== "suporte@prestativaautomacao.com.br") {
    res.status(403).json({ error: "Apenas o usuário master suporte@prestativaautomacao.com.br tem acesso para gerenciar as permissões." });
    return;
  }

  const perms = readPermissionsDatabase();
  res.json(perms);
});

// E. Update Permissions configurations
app.post("/api/permissions", (req, res) => {
  const agentEmail = req.headers["x-agent-email"] as string;
  if (agentEmail?.toLowerCase().trim() !== "suporte@prestativaautomacao.com.br") {
    res.status(403).json({ error: "Apenas o usuário master suporte@prestativaautomacao.com.br tem permissão para alterar as regras de perfil." });
    return;
  }

  const newPerms = req.body;
  if (!newPerms || !newPerms.administrador || !newPerms.tecnico || !newPerms.cliente) {
    res.status(400).json({ error: "Corpo do schema de permissões de perfis inválido." });
    return;
  }

  writePermissionsDatabase(newPerms);
  res.json({ success: true, message: "Permissões de perfis atualizadas com sucesso!" });
});

// 0. Agent Identification and Authentication API

app.get("/api/chat-history", (req, res) => {
  const history = readChatHistoryDatabase();
  res.json(history);
});

app.post("/api/chat-history", (req, res) => {
  const { ticketId, ticketTitle, agentName, agentEmail, spaceName } = req.body;
  if (!ticketId || !agentName) {
    res.status(400).json({ error: "Parâmetros obrigatórios ausentes" });
    return;
  }
  
  const history = readChatHistoryDatabase();
  const newEntry: ChatShareHistory = {
    id: Date.now().toString(),
    ticketId,
    ticketTitle: ticketTitle || "Desconhecido",
    agentName,
    agentEmail: agentEmail || "",
    spaceName: spaceName || "",
    sharedAt: new Date().toISOString(),
  };

  history.push(newEntry);
  writeChatHistoryDatabase(history);

  res.json(newEntry);
});

app.post("/api/auth/unified-login", (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ error: "E-mail é obrigatório para identificação." });
    return;
  }

  const agents = readAgentsDatabase();
  const found = agents.find(
    a => a.email.toLowerCase() === email.toLowerCase().trim()
  );

  if (!found) {
    res.status(401).json({ error: "E-mail não cadastrado no sistema. Verifique ou entre em contato com o suporte." });
    return;
  }

  // If the profile is "cliente", password-less access is permitted
  if (found.profile === "cliente") {
    res.json({
      success: true,
      user: {
        name: found.name,
        email: found.email,
        profile: "cliente",
        company: found.company
      }
    });
    return;
  }

  // For other profiles, password is required
  if (!password) {
    res.status(400).json({ error: "A senha de acesso é obrigatória para este perfil profissional." });
    return;
  }

  if (found.password !== password) {
    res.status(401).json({ error: "Senha incorreta para o perfil de atendimento." });
    return;
  }

  // Success
  res.json({
    success: true,
    user: {
      name: found.name,
      email: found.email,
      profile: found.profile || "tecnico",
      company: found.company
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios para acessar o painel de suporte." });
    return;
  }

  const agents = readAgentsDatabase();
  const agent = agents.find(
    a => a.email.toLowerCase() === email.toLowerCase().trim() && a.password === password
  );

  if (!agent) {
    res.status(401).json({ error: "Credenciais de suporte inválidas. Verifique o e-mail ou a senha informados." });
    return;
  }

  // Success
  res.json({
    success: true,
    agent: {
      name: agent.name,
      email: agent.email,
      profile: agent.profile || "tecnico",
      company: agent.company
    }
  });
});

// 0.5. Customer Password-Free Login (requires registered 'cliente' access profile)
app.post("/api/auth/client-login", (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "E-mail é obrigatório para identificação." });
    return;
  }

  const agents = readAgentsDatabase();
  const found = agents.find(
    a => a.email.toLowerCase() === email.toLowerCase().trim() && a.profile === "cliente"
  );

  if (!found) {
    res.status(401).json({ error: "Acesso de cliente não localizado. Certifique-se de que seu e-mail foi cadastrado por nossa equipe ou abra um chamado pelo WhatsApp para auto-cadastro." });
    return;
  }

  res.json({
    success: true,
    client: {
      name: found.name,
      email: found.email,
      profile: "cliente",
      company: found.company
    }
  });
});

// Implement Vite server integration as middleware for DEV and static server for PROD
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Support Ticket DB] Server running at http://localhost:${PORT}`);
  });
}

startServer();
