import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTicket } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Send, Clock, User, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { ticket, messages, loading, sendMessage } = useTicket(id);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!ticket) {
    return <div className="py-12 text-center text-muted-foreground">Ticket not found</div>;
  }

  const basePath = profile?.role === 'admin' ? '/admin' : profile?.role === 'agent' ? '/agent' : '/user';

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(`${basePath}/tickets`)}>
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
                  <div key={msg.id} className={`flex gap-3 ${msg.is_internal ? 'bg-warning/5 -mx-6 px-6 py-3 border-l-4 border-warning' : ''}`}>
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
                        {msg.is_internal && <Badge variant="outline" className="text-xs">Internal</Badge>}
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
                <Textarea placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={3} />
                <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="gradient-primary text-white">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bento-card">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{ticket.category?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned To</span>
                <span>{ticket.agent?.name || 'Unassigned'}</span>
              </div>
              {ticket.sla_response_due && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Due</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(ticket.sla_response_due), 'MMM d, HH:mm')}
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

export default TicketDetail;
