import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Users, Clock, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { tickets, loading } = useTickets();

  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const resolvedToday = tickets.filter(t => {
    if (t.status !== 'resolved') return false;
    const today = new Date();
    const updated = new Date(t.updated_at);
    return updated.toDateString() === today.toDateString();
  });
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && !['closed', 'resolved'].includes(t.status));

  const stats = [
    { label: 'Total Tickets', value: tickets.length, icon: Ticket, color: 'text-primary' },
    { label: 'Open', value: openTickets.length, icon: Clock, color: 'text-info' },
    { label: 'In Progress', value: inProgressTickets.length, icon: TrendingUp, color: 'text-warning' },
    { label: 'Resolved Today', value: resolvedToday.length, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
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

      {urgentTickets.length > 0 && (
        <Card className="bento-card border-destructive/50">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Urgent Tickets ({urgentTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentTickets.slice(0, 3).map((ticket) => (
                <Link key={ticket.id} to={`/admin/tickets/${ticket.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3 hover:bg-destructive/5">
                    <div>
                      <span className="font-mono text-sm">SS-{ticket.ticket_number}</span>
                      <p className="font-medium">{ticket.title}</p>
                    </div>
                    <Badge className="status-escalated">{ticket.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bento-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tickets</CardTitle>
            <Link to="/admin/tickets"><Button variant="ghost" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading...</p> : tickets.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No tickets</p>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} to={`/admin/tickets/${ticket.id}`} className="block">
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">SS-{ticket.ticket_number}</span>
                          <Badge variant="outline" className={`priority-${ticket.priority} text-xs`}>{ticket.priority}</Badge>
                          <Badge variant="outline" className={`status-${ticket.status} text-xs`}>{ticket.status}</Badge>
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
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Link to="/admin/users"><Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Manage Users</Button></Link>
            <Link to="/admin/teams"><Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Manage Teams</Button></Link>
            <Link to="/admin/sla-rules"><Button variant="outline" className="w-full justify-start"><Clock className="mr-2 h-4 w-4" /> SLA Rules</Button></Link>
            <Link to="/admin/reports"><Button variant="outline" className="w-full justify-start"><TrendingUp className="mr-2 h-4 w-4" /> View Reports</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
