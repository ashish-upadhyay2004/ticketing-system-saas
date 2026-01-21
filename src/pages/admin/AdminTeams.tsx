import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Users, Trash2, Edit, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminTeams: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedAgent, setSelectedAgent] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    const [teamsRes, agentsRes] = await Promise.all([
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, name, email').in('role', ['agent', 'admin']),
    ]);
    
    setTeams(teamsRes.data || []);
    setAgents(agentsRes.data || []);

    // Fetch members for each team
    if (teamsRes.data) {
      const membersMap: Record<string, any[]> = {};
      for (const team of teamsRes.data) {
        const { data } = await supabase
          .from('team_members')
          .select('*, agent:profiles!team_members_agent_id_fkey(name, email)')
          .eq('team_id', team.id);
        membersMap[team.id] = data || [];
      }
      setTeamMembers(membersMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (selectedTeam) {
      const { error } = await supabase
        .from('teams')
        .update({ name: formData.name, description: formData.description })
        .eq('id', selectedTeam.id);
      if (error) toast.error('Failed to update team');
      else toast.success('Team updated');
    } else {
      const { error } = await supabase
        .from('teams')
        .insert({ name: formData.name, description: formData.description });
      if (error) toast.error('Failed to create team');
      else toast.success('Team created');
    }

    setDialogOpen(false);
    setSelectedTeam(null);
    setFormData({ name: '', description: '' });
    fetchTeams();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) toast.error('Failed to delete team');
    else {
      toast.success('Team deleted');
      fetchTeams();
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedAgent) return;

    const { error } = await supabase.from('team_members').insert({
      team_id: selectedTeam.id,
      agent_id: selectedAgent,
    });

    if (error) {
      toast.error('Failed to add member');
    } else {
      toast.success('Member added');
      setMemberDialogOpen(false);
      setSelectedAgent('');
      fetchTeams();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) toast.error('Failed to remove member');
    else {
      toast.success('Member removed');
      fetchTeams();
    }
  };

  const openEdit = (team: any) => {
    setSelectedTeam(team);
    setFormData({ name: team.name, description: team.description || '' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Organize agents into teams</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white" onClick={() => { setSelectedTeam(null); setFormData({ name: '', description: '' }); }}>
              <Plus className="mr-2 h-4 w-4" /> New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
      ) : teams.length === 0 ? (
        <Card className="bento-card">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No teams yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id} className="bento-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {team.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{team.description || 'No description'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(team)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{teamMembers[team.id]?.length || 0} members</span>
                  <Dialog open={memberDialogOpen && selectedTeam?.id === team.id} onOpenChange={(open) => { setMemberDialogOpen(open); if (open) setSelectedTeam(team); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTeam(team)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
                      <div className="py-4">
                        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                          <SelectTrigger><SelectValue placeholder="Select agent..." /></SelectTrigger>
                          <SelectContent>
                            {agents.filter(a => !teamMembers[team.id]?.some(m => m.agent_id === a.user_id)).map(a => (
                              <SelectItem key={a.user_id} value={a.user_id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMember} disabled={!selectedAgent}>Add</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {teamMembers[team.id]?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{member.agent?.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTeams;
