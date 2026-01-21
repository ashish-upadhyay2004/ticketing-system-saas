import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, PlusCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const UserDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { tickets, loading } = useTickets();

  const myTickets = tickets.filter(t => t.created_by === profile?.user_id);
  const openTickets = myTickets.filter(t => !['closed', 'resolved', 'cancelled'].includes(t.status));
  const resolvedTickets = myTickets.filter(t => t.status === 'resolved');

  const stats = [
    { label: 'Total Tickets', value: myTickets.length, icon: Ticket, color: 'text-primary' },
    { label: 'Open', value: openTickets.length, icon: AlertCircle, color: 'text-warning' },
    { label: 'Resolved', value: resolvedTickets.length, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {profile?.name}!</h1>
          <p className="text-muted-foreground">Here's an overview of your support tickets</p>
        </div>
        <Link to="/user/tickets/new">
          <Button className="gradient-primary text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

      <Card className="bento-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.recentTickets')}</CardTitle>
          <Link to="/user/tickets">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : myTickets.length === 0 ? (
            <div className="py-8 text-center">
              <Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No tickets yet</p>
              <Link to="/user/tickets/new">
                <Button className="mt-4" variant="outline">Create your first ticket</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myTickets.slice(0, 5).map((ticket) => (
                <Link key={ticket.id} to={`/user/tickets/${ticket.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">SS-{ticket.ticket_number}</span>
                        <Badge variant="outline" className={`priority-${ticket.priority}`}>{ticket.priority}</Badge>
                        <Badge variant="outline" className={`status-${ticket.status}`}>{ticket.status}</Badge>
                      </div>
                      <p className="mt-1 font-medium">{ticket.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
