import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AgentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { tickets, loading } = useTickets();

  const myAssigned = tickets.filter(t => t.assigned_agent === profile?.user_id);
  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgress = myAssigned.filter(t => t.status === 'in_progress');
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && !['closed', 'resolved'].includes(t.status));

  const stats = [
    { label: 'My Assigned', value: myAssigned.length, icon: Ticket, color: 'text-primary' },
    { label: 'Open Queue', value: openTickets.length, icon: Clock, color: 'text-info' },
    { label: 'In Progress', value: inProgress.length, icon: TrendingUp, color: 'text-warning' },
    { label: 'Urgent', value: urgentTickets.length, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Agent Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bento-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-10 w-10 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bento-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Assigned Tickets</CardTitle>
            <Link to="/agent/tickets"><Button variant="ghost" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading...</p> : myAssigned.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No assigned tickets</p>
            ) : (
              <div className="space-y-3">
                {myAssigned.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} to={`/agent/tickets/${ticket.id}`} className="block">
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">SS-{ticket.ticket_number}</span>
                          <Badge variant="outline" className={`priority-${ticket.priority} text-xs`}>{ticket.priority}</Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{ticket.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bento-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Open Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {openTickets.length === 0 ? (
              <div className="py-4 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-success mb-2" /><p className="text-muted-foreground">Queue is empty!</p></div>
            ) : (
              <div className="space-y-3">
                {openTickets.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} to={`/agent/tickets/${ticket.id}`} className="block">
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">SS-{ticket.ticket_number}</span>
                          <Badge variant="outline" className={`priority-${ticket.priority} text-xs`}>{ticket.priority}</Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{ticket.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentDashboard;
