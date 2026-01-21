import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Download, History, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const actionTypeLabels: Record<string, { label: string; color: string }> = {
  ticket_created: { label: 'Created', color: 'bg-success/10 text-success' },
  ticket_updated: { label: 'Updated', color: 'bg-info/10 text-info' },
  ticket_assigned: { label: 'Assigned', color: 'bg-primary/10 text-primary' },
  status_changed: { label: 'Status Change', color: 'bg-warning/10 text-warning' },
  message_sent: { label: 'Message', color: 'bg-muted text-muted-foreground' },
  internal_note_added: { label: 'Internal Note', color: 'bg-warning/10 text-warning' },
};

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles!audit_logs_actor_id_fkey(name, email),
        ticket:tickets!audit_logs_ticket_id_fkey(ticket_number, title)
      `)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (actionFilter !== 'all') {
      query = query.eq('action_type', actionFilter);
    }

    const { data, error } = await query;
    if (error) toast.error('Failed to fetch logs');
    else setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.actor?.name?.toLowerCase().includes(searchLower) ||
      log.actor?.email?.toLowerCase().includes(searchLower) ||
      log.ticket?.title?.toLowerCase().includes(searchLower) ||
      `SS-${log.ticket?.ticket_number}`.toLowerCase().includes(searchLower) ||
      log.action_type.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Ticket', 'Details'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.actor?.name || 'System',
      log.action_type,
      log.ticket ? `SS-${log.ticket.ticket_number}` : '-',
      JSON.stringify(log.details || {}),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Exported to CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="bento-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="ticket_created">Ticket Created</SelectItem>
                <SelectItem value="ticket_updated">Ticket Updated</SelectItem>
                <SelectItem value="ticket_assigned">Ticket Assigned</SelectItem>
                <SelectItem value="status_changed">Status Changed</SelectItem>
                <SelectItem value="message_sent">Message Sent</SelectItem>
                <SelectItem value="internal_note_added">Internal Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const actionInfo = actionTypeLabels[log.action_type] || { label: log.action_type, color: 'bg-muted' };
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{log.actor?.name || 'System'}</p>
                              {log.actor?.email && (
                                <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.ticket ? (
                              <div>
                                <span className="font-mono text-xs">SS-{log.ticket.ticket_number}</span>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{log.ticket.title}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.details && Object.keys(log.details).length > 0 ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {JSON.stringify(log.details).substring(0, 50)}...
                              </code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} - {page * pageSize + filteredLogs.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={filteredLogs.length < pageSize}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
