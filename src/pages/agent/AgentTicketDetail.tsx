import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTicket, useTickets } from '@/hooks/useTickets';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Clock, User, Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

const statusOptions: TicketStatus[] = ['open', 'assigned', 'in_progress', 'waiting_on_user', 'on_hold', 'escalated', 'resolved', 'closed'];
const priorityOptions: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const AgentTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { ticket, messages, loading, sendMessage, refetch } = useTicket(id);
  const { assignTicket, updateStatus, updateTicket } = useTickets();
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [agentsRes, teamsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, name, email').in('role', ['agent', 'admin']),
        supabase.from('teams').select('id, name'),
      ]);
      setAgents(agentsRes.data || []);
      setTeams(teamsRes.data || []);
    };
    fetchData();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage(newMessage.trim(), isInternal);
      setNewMessage('');
      setIsInternal(false);
      toast.success(isInternal ? 'Internal note added' : 'Message sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAssign = async (agentId: string) => {
    try {
      await assignTicket(ticket!.id, agentId === 'unassigned' ? null : agentId);
      refetch();
      toast.success('Ticket assigned');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateStatus(ticket!.id, status);
      refetch();
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    try {
      await updateTicket(ticket!.id, { priority });
      refetch();
      toast.success('Priority updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAssignToMe = async () => {
    if (user) {
      await handleAssign(user.id);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!ticket) {
    return <div className="py-12 text-center text-muted-foreground">Ticket not found</div>;
  }

  const slaResponseDue = ticket.sla_response_due ? new Date(ticket.sla_response_due) : null;
  const slaResolveDue = ticket.sla_resolve_due ? new Date(ticket.sla_resolve_due) : null;
  const now = new Date();
  const responseMinutes = slaResponseDue ? differenceInMinutes(slaResponseDue, now) : null;
  const resolveMinutes = slaResolveDue ? differenceInMinutes(slaResolveDue, now) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/agent/tickets')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bento-card">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-muted-foreground">SS-{ticket.ticket_number}</span>
                <Badge className={`priority-${ticket.priority}`}>{ticket.priority}</Badge>
                <Badge className={`status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</Badge>
                {ticket.sla_breached && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" /> SLA Breached
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card className="bento-card">
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No messages yet</p>
              ) : (
                messages.map((msg: any) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.is_internal ? 'bg-warning/10 -mx-6 px-6 py-3 border-l-4 border-warning' : ''}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {msg.sender?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{msg.sender?.name || 'Unknown'}</span>
                        {msg.sender?.role && msg.sender.role !== 'user' && (
                          <Badge variant="secondary" className="text-xs">{msg.sender.role}</Badge>
                        )}
                        {msg.is_internal && <Badge variant="outline" className="text-xs bg-warning/20">Internal Note</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
                  <Label htmlFor="internal" className="text-sm text-muted-foreground">Internal note (only visible to agents)</Label>
                </div>
                <Textarea 
                  placeholder={isInternal ? "Add internal note..." : "Type your message..."} 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  rows={3}
                  className={isInternal ? 'border-warning/50' : ''}
                />
                <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="gradient-primary text-white">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> {isInternal ? 'Add Note' : 'Send'}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bento-card">
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!ticket.assigned_agent && (
                <Button onClick={handleAssignToMe} className="w-full gradient-primary text-white">
                  <UserPlus className="mr-2 h-4 w-4" /> Assign to Me
                </Button>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Select value={ticket.status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Priority</Label>
                <Select value={ticket.priority} onValueChange={(v) => handlePriorityChange(v as TicketPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Assigned Agent</Label>
                <Select value={ticket.assigned_agent || 'unassigned'} onValueChange={handleAssign}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map(a => (
                      <SelectItem key={a.user_id} value={a.user_id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bento-card">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requester</span>
                <span>{ticket.creator?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{ticket.category?.name || '-'}</span>
              </div>
              {slaResponseDue && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Due</span>
                  <span className={`flex items-center gap-1 ${responseMinutes && responseMinutes < 30 ? 'text-destructive' : ''}`}>
                    <Clock className="h-3 w-3" />
                    {responseMinutes && responseMinutes > 0 ? `${responseMinutes}m` : 'Overdue'}
                  </span>
                </div>
              )}
              {slaResolveDue && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolve Due</span>
                  <span className={`flex items-center gap-1 ${resolveMinutes && resolveMinutes < 60 ? 'text-warning' : ''}`}>
                    <Clock className="h-3 w-3" />
                    {format(slaResolveDue, 'MMM d, HH:mm')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentTicketDetail;
