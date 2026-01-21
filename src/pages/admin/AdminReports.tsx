import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, TrendingUp, Clock, Users, Ticket, BarChart3, PieChart } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--success))'];

const AdminReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    avgResolutionTime: 0,
    byStatus: [] as { name: string; value: number }[],
    byPriority: [] as { name: string; value: number }[],
    byDay: [] as { date: string; tickets: number; resolved: number }[],
    topAgents: [] as { name: string; resolved: number }[],
  });

  const fetchStats = async () => {
    setLoading(true);
    const days = parseInt(dateRange);
    const startDate = startOfDay(subDays(new Date(), days));
    
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*, agent:profiles!tickets_assigned_agent_fkey(name)')
      .gte('created_at', startDate.toISOString());

    if (!tickets) {
      setLoading(false);
      return;
    }

    // Calculate stats
    const total = tickets.length;
    const open = tickets.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length;
    const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;

    // By status
    const statusCounts: Record<string, number> = {};
    tickets.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // By priority
    const priorityCounts: Record<string, number> = {};
    tickets.forEach(t => {
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });
    const byPriority = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

    // By day
    const byDayMap: Record<string, { tickets: number; resolved: number }> = {};
    for (let i = days; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM d');
      byDayMap[date] = { tickets: 0, resolved: 0 };
    }
    tickets.forEach(t => {
      const date = format(new Date(t.created_at), 'MMM d');
      if (byDayMap[date]) {
        byDayMap[date].tickets++;
        if (['resolved', 'closed'].includes(t.status)) {
          byDayMap[date].resolved++;
        }
      }
    });
    const byDay = Object.entries(byDayMap).map(([date, data]) => ({ date, ...data }));

    // Top agents
    const agentCounts: Record<string, { name: string; resolved: number }> = {};
    tickets.filter(t => t.agent && ['resolved', 'closed'].includes(t.status)).forEach(t => {
      const agentId = t.assigned_agent!;
      if (!agentCounts[agentId]) {
        agentCounts[agentId] = { name: t.agent?.name || 'Unknown', resolved: 0 };
      }
      agentCounts[agentId].resolved++;
    });
    const topAgents = Object.values(agentCounts).sort((a, b) => b.resolved - a.resolved).slice(0, 5);

    setStats({ total, open, resolved, avgResolutionTime: 0, byStatus, byPriority, byDay, topAgents });
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, [dateRange]);

  const handleExport = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Tickets', stats.total],
      ['Open Tickets', stats.open],
      ['Resolved Tickets', stats.resolved],
      ['Resolution Rate', `${stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%`],
    ];
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Report exported');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track performance and trends</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bento-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="h-10 w-10 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-3xl font-bold">{stats.open}</p>
              </div>
              <Clock className="h-10 w-10 text-warning opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold">{stats.resolved}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-3xl font-bold">{stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0}%</p>
              </div>
              <BarChart3 className="h-10 w-10 text-info opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bento-card">
          <CardHeader><CardTitle>Tickets Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.byDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="tickets" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bento-card">
          <CardHeader><CardTitle>By Priority</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={stats.byPriority}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.byPriority.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bento-card">
          <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bento-card">
          <CardHeader><CardTitle>Top Agents</CardTitle></CardHeader>
          <CardContent>
            {stats.topAgents.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <Users className="h-8 w-8 mr-2" /> No data yet
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topAgents.map((agent, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.resolved} tickets resolved</p>
                    </div>
                    <Badge variant="secondary">{agent.resolved}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
