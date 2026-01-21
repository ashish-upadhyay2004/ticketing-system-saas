import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import type { Database } from '@/integrations/supabase/types';

type TicketPriority = Database['public']['Enums']['ticket_priority'];

interface SLARule {
  id: string;
  priority: TicketPriority;
  response_minutes: number;
  resolve_minutes: number;
}

const priorityOrder: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

const AdminSLARules: React.FC = () => {
  const [rules, setRules] = useState<SLARule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedRules, setEditedRules] = useState<Record<string, { response_minutes: number; resolve_minutes: number }>>({});

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sla_rules').select('*');
    if (error) {
      toast.error('Failed to fetch SLA rules');
    } else {
      // Sort by priority order
      const sorted = (data || []).sort((a, b) => 
        priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
      );
      setRules(sorted);
      
      // Initialize edit state
      const edits: Record<string, { response_minutes: number; resolve_minutes: number }> = {};
      sorted.forEach(r => {
        edits[r.id] = { response_minutes: r.response_minutes, resolve_minutes: r.resolve_minutes };
      });
      setEditedRules(edits);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleChange = (id: string, field: 'response_minutes' | 'resolve_minutes', value: number) => {
    setEditedRules(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const rule of rules) {
        const edited = editedRules[rule.id];
        if (edited.response_minutes !== rule.response_minutes || edited.resolve_minutes !== rule.resolve_minutes) {
          await supabase.from('sla_rules').update({
            response_minutes: edited.response_minutes,
            resolve_minutes: edited.resolve_minutes,
          }).eq('id', rule.id);
        }
      }
      toast.success('SLA rules saved');
      fetchRules();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const priorityColors: Record<TicketPriority, string> = {
    urgent: 'bg-destructive text-destructive-foreground',
    high: 'bg-warning text-warning-foreground',
    medium: 'bg-info text-info-foreground',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLA Rules</h1>
          <p className="text-muted-foreground">Define response and resolution time targets</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-white">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Card className="bento-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No SLA rules configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>First Response Time</TableHead>
                  <TableHead>Resolution Time</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge className={priorityColors[rule.priority]}>{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          className="w-24"
                          value={editedRules[rule.id]?.response_minutes || 0}
                          onChange={(e) => handleChange(rule.id, 'response_minutes', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          className="w-24"
                          value={editedRules[rule.id]?.resolve_minutes || 0}
                          onChange={(e) => handleChange(rule.id, 'resolve_minutes', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Response: {formatTime(editedRules[rule.id]?.response_minutes || 0)}
                        </span>
                        <span className="text-sm">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Resolve: {formatTime(editedRules[rule.id]?.resolve_minutes || 0)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSLARules;
