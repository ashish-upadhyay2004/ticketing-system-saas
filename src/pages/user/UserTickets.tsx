import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, Clock, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const UserTickets: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { tickets, loading } = useTickets({ search: search || undefined });

  const myTickets = tickets.filter(t => t.created_by === profile?.user_id);
  const filteredTickets = statusFilter === 'all' 
    ? myTickets 
    : myTickets.filter(t => t.status === statusFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Tickets</h1>
        <Link to="/user/tickets/new">
          <Button className="gradient-primary text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <Card className="bento-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Tickets ({filteredTickets.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center">
              <Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Link key={ticket.id} to={`/user/tickets/${ticket.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted/50 hover:shadow-md">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">SS-{ticket.ticket_number}</span>
                        <Badge variant="outline" className={`priority-${ticket.priority}`}>{ticket.priority}</Badge>
                        <Badge variant="outline" className={`status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</Badge>
                        {ticket.category?.name && <Badge variant="secondary">{ticket.category.name}</Badge>}
                      </div>
                      <p className="mt-1 font-medium">{ticket.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2 text-sm text-muted-foreground">
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

export default UserTickets;
