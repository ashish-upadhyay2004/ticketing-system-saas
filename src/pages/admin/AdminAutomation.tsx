import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Zap, Trash2, Edit, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import type { Database } from '@/integrations/supabase/types';

type AutomationTrigger = Database['public']['Enums']['automation_trigger'];

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  condition: any;
  action: any;
}

const triggerLabels: Record<AutomationTrigger, string> = {
  on_create: 'When ticket is created',
  on_status_change: 'When status changes',
  on_priority_change: 'When priority changes',
  time_based: 'Time-based trigger',
};

const AdminAutomation: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    trigger: AutomationTrigger;
    condition: Record<string, any>;
    action: Record<string, any>;
  }>({
    name: '',
    trigger: 'on_create',
    condition: { priority: 'urgent' },
    action: { assign_team: '', notify_admin: true, escalate: false },
  });

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to fetch rules');
    else setRules((data || []) as AutomationRule[]);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = {
      name: formData.name,
      trigger: formData.trigger,
      condition: formData.condition,
      action: formData.action,
      enabled: true,
    };

    if (selectedRule) {
      const { error } = await supabase.from('automation_rules').update(payload).eq('id', selectedRule.id);
      if (error) toast.error('Failed to update');
      else toast.success('Rule updated');
    } else {
      const { error } = await supabase.from('automation_rules').insert(payload);
      if (error) toast.error('Failed to create');
      else toast.success('Rule created');
    }

    setDialogOpen(false);
    setSelectedRule(null);
    setFormData({ name: '', trigger: 'on_create', condition: { priority: 'urgent' }, action: { assign_team: '', notify_admin: true } });
    fetchRules();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from('automation_rules').update({ enabled }).eq('id', id);
    if (error) toast.error('Failed to update');
    else fetchRules();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('automation_rules').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchRules(); }
  };

  const openEdit = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      trigger: rule.trigger,
      condition: rule.condition || {},
      action: rule.action || {},
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Rules</h1>
          <p className="text-muted-foreground">Automate ticket workflows</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white" onClick={() => { setSelectedRule(null); setFormData({ name: '', trigger: 'on_create', condition: { priority: 'any' }, action: { notify_admin: false, escalate: false } }); }}>
              <Plus className="mr-2 h-4 w-4" /> New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{selectedRule ? 'Edit' : 'Create'} Automation Rule</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Auto-assign urgent tickets" />
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select value={formData.trigger} onValueChange={(v) => setFormData({ ...formData, trigger: v as AutomationTrigger })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition (Priority)</Label>
                <Select 
                  value={formData.condition?.priority || 'any'} 
                  onValueChange={(v) => setFormData({ ...formData, condition: { ...formData.condition, priority: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.action?.notify_admin || false} 
                    onCheckedChange={(v) => setFormData({ ...formData, action: { ...formData.action, notify_admin: v } })}
                  />
                  <span className="text-sm">Notify admins</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Switch 
                    checked={formData.action?.escalate || false} 
                    onCheckedChange={(v) => setFormData({ ...formData, action: { ...formData.action, escalate: v } })}
                  />
                  <span className="text-sm">Escalate ticket</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gradient-primary text-white">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : rules.length === 0 ? (
        <Card className="bento-card">
          <CardContent className="py-12 text-center">
            <Zap className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No automation rules yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={`bento-card ${!rule.enabled ? 'opacity-60' : ''}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-success/10' : 'bg-muted'}`}>
                      <Zap className={`h-5 w-5 ${rule.enabled ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground">{triggerLabels[rule.trigger]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch checked={rule.enabled} onCheckedChange={(v) => handleToggle(rule.id, v)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAutomation;
