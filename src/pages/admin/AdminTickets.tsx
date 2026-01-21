import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '@/hooks/useTickets';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, UserPlus, Loader2, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const AdminTickets: React.FC = () => {
  const { tickets, loading, assignTicket, updateStatus } = useTickets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [bulkAgent, setBulkAgent] = useState<string>('');

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase.from('profiles').select('user_id, name').in('role', ['agent', 'admin']);
      setAgents(data || []);
    };
    fetchAgents();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      `SS-${ticket.ticket_number}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleBulkAssign = async () => {
    if (!bulkAgent) return;
    for (const ticketId of selectedTickets) {
      await assignTicket(ticketId, bulkAgent);
    }
    setSelectedTickets([]);
    setBulkAgent('');
    toast.success(`${selectedTickets.length} tickets assigned`);
  };

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Title', 'Status', 'Priority', 'Requester', 'Agent', 'Created'];
    const rows = filteredTickets.map(t => [
      `SS-${t.ticket_number}`,
      t.title,
      t.status,
      t.priority,
      t.creator?.name || '',
      t.agent?.name || '',
      new Date(t.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets.csv';
    a.click();
    toast.success('Exported to CSV');
  };

  const toggleSelect = (id: string) => {
    setSelectedTickets(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Tickets</h1>
          <p className="text-muted-foreground">{tickets.length} total tickets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {selectedTickets.length > 0 && (
        <Card className="bento-card border-primary/50">
          <CardContent className="py-4 flex items-center gap-4">
            <span className="text-sm">{selectedTickets.length} selected</span>
            <Select value={bulkAgent} onValueChange={setBulkAgent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map(a => (
                  <SelectItem key={a.user_id} value={a.user_id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAssign} disabled={!bulkAgent}>
              <UserPlus className="mr-2 h-4 w-4" /> Assign
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bento-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                        onCheckedChange={() => {
                          if (selectedTickets.length === filteredTickets.length) {
                            setSelectedTickets([]);
                          } else {
                            setSelectedTickets(filteredTickets.map(t => t.id));
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Checkbox checked={selectedTickets.includes(ticket.id)} onCheckedChange={() => toggleSelect(ticket.id)} />
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/tickets/${ticket.id}`} className="hover:underline">
                          <span className="font-mono text-xs text-muted-foreground">SS-{ticket.ticket_number}</span>
                          <p className="font-medium truncate max-w-[200px]">{ticket.title}</p>
                        </Link>
                      </TableCell>
                      <TableCell><Badge className={`status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={`priority-${ticket.priority}`}>{ticket.priority}</Badge></TableCell>
                      <TableCell className="text-sm">{ticket.creator?.name || '-'}</TableCell>
                      <TableCell className="text-sm">{ticket.agent?.name || 'Unassigned'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTickets;
