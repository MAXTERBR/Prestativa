/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TicketCategory = 'technical' | 'billing' | 'question' | 'feature' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'solved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketInteraction {
  id: string;
  author: string;
  role: 'customer' | 'agent' | 'system';
  message: string;
  createdAt: string; // ISO date-time
  attachments?: { name: string; dataUrl: string; size?: number; type?: string }[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  customerName: string;
  customerEmail: string;
  company?: string;
  assignedAgent?: string;
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
  interactions: TicketInteraction[];
  attachments?: { name: string; dataUrl: string; size?: number; type?: string }[];
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  solved: number;
  closed: number;
  byCategory: Record<TicketCategory, number>;
  byPriority: Record<TicketPriority, number>;
}

export interface SentEmail {
  id: string;
  ticketId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  status: 'sent' | 'failed' | 'simulated';
  error?: string;
  createdAt: string; // ISO date-time
}

export interface ChatShareHistory {
  id: string;
  ticketId: string;
  ticketTitle: string;
  agentName: string;
  agentEmail: string;
  spaceName: string;
  sharedAt: string; // ISO date-time
}

