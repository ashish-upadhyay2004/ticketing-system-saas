import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
type TicketUpdate = Database['public']['Tables']['tickets']['Update'];
type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

interface TicketWithRelations extends Ticket {
  creator?: { name: string; email: string } | null;
  agent?: { name: string; email: string } | null;
  team?: { name: string } | null;
  category?: { name: string } | null;
}

interface TicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  assignedAgent?: string;
  assignedTeam?: string;
  category?: string;
  search?: string;
}

export const useTickets = (filters?: TicketFilters) => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('tickets')
        .select(`
          *,
          creator:profiles!tickets_created_by_fkey(name, email),
          agent:profiles!tickets_assigned_agent_fkey(name, email),
          team:teams!tickets_assigned_team_fkey(name),
          category:categories!tickets_category_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority);
        } else {
          query = query.eq('priority', filters.priority);
        }
      }

      if (filters?.assignedAgent) {
        query = query.eq('assigned_agent', filters.assignedAgent);
      }

      if (filters?.assignedTeam) {
        query = query.eq('assigned_team', filters.assignedTeam);
      }

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTickets(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  const createTicket = async (ticket: Omit<TicketInsert, 'created_by'>) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tickets')
      .insert({ ...ticket, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      ticket_id: data.id,
      action_type: 'ticket_created',
      details: { title: ticket.title, priority: ticket.priority },
    });

    // Create notification for the user
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Ticket Created',
      body: `Your ticket "${ticket.title}" has been created successfully.`,
      type: 'ticket_created',
      ticket_id: data.id,
    });

    await fetchTickets();
    return data;
  };

  const updateTicket = async (id: string, updates: TicketUpdate) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      ticket_id: id,
      action_type: 'ticket_updated',
      details: updates,
    });

    await fetchTickets();
    return data;
  };

  const assignTicket = async (ticketId: string, agentId: string | null, teamId?: string | null) => {
    if (!user) throw new Error('Not authenticated');

    const updates: TicketUpdate = {
      assigned_agent: agentId,
      assigned_team: teamId,
      status: agentId ? 'assigned' : 'open',
    };

    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    // Notify assigned agent
    if (agentId) {
      await supabase.from('notifications').insert({
        user_id: agentId,
        title: 'Ticket Assigned',
        body: `You have been assigned to ticket #${data.ticket_number}`,
        type: 'ticket_assigned',
        ticket_id: ticketId,
      });
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      ticket_id: ticketId,
      action_type: 'ticket_assigned',
      details: { assigned_agent: agentId, assigned_team: teamId },
    });

    await fetchTickets();
    return data;
  };

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select(`*, creator:profiles!tickets_created_by_fkey(name, email)`)
      .single();

    if (error) throw error;

    // Notify ticket creator
    if (data.created_by && data.created_by !== user.id) {
      await supabase.from('notifications').insert({
        user_id: data.created_by,
        title: 'Ticket Status Updated',
        body: `Your ticket #${data.ticket_number} status changed to ${status}`,
        type: 'ticket_updated',
        ticket_id: ticketId,
      });
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      ticket_id: ticketId,
      action_type: 'status_changed',
      details: { new_status: status },
    });

    await fetchTickets();
    return data;
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTickets]);

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    assignTicket,
    updateStatus,
    refetch: fetchTickets,
  };
};

export const useTicket = (ticketId: string | undefined) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [messages, setMessages] = useState<Database['public']['Tables']['ticket_messages']['Row'][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTicket = useCallback(async () => {
    if (!user || !ticketId) {
      setTicket(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          creator:profiles!tickets_created_by_fkey(name, email),
          agent:profiles!tickets_assigned_agent_fkey(name, email),
          team:teams!tickets_assigned_team_fkey(name),
          category:categories!tickets_category_id_fkey(name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  }, [user, ticketId]);

  const fetchMessages = useCallback(async () => {
    if (!user || !ticketId) {
      setMessages([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:profiles!ticket_messages_sender_id_fkey(name, email, role)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [user, ticketId]);

  const sendMessage = async (message: string, isInternal: boolean = false) => {
    if (!user || !ticketId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message,
        is_internal: isInternal,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify relevant users
    if (ticket) {
      const notifyUserId = user.id === ticket.created_by ? ticket.assigned_agent : ticket.created_by;
      if (notifyUserId && !isInternal) {
        await supabase.from('notifications').insert({
          user_id: notifyUserId,
          title: 'New Message',
          body: `New reply on ticket #${ticket.ticket_number}`,
          type: 'ticket_message',
          ticket_id: ticketId,
        });
      }
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      ticket_id: ticketId,
      action_type: isInternal ? 'internal_note_added' : 'message_sent',
      details: { message_preview: message.substring(0, 100) },
    });

    await fetchMessages();
    return data;
  };

  useEffect(() => {
    fetchTicket();
    fetchMessages();
  }, [fetchTicket, fetchMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!user || !ticketId) return;

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, ticketId, fetchMessages]);

  return {
    ticket,
    messages,
    loading,
    sendMessage,
    refetch: () => {
      fetchTicket();
      fetchMessages();
    },
  };
};
