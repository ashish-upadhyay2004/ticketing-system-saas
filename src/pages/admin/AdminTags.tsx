import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Tag, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const colorOptions = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', 
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

const AdminTags: React.FC = () => {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' });

  const fetchTags = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tags').select('*').order('name');
    if (error) toast.error('Failed to fetch tags');
    else setTags(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (selectedTag) {
      const { error } = await supabase.from('tags').update(formData).eq('id', selectedTag.id);
      if (error) toast.error('Failed to update');
      else toast.success('Tag updated');
    } else {
      const { error } = await supabase.from('tags').insert(formData);
      if (error) toast.error('Failed to create');
      else toast.success('Tag created');
    }

    setDialogOpen(false);
    setSelectedTag(null);
    setFormData({ name: '', color: '#6366f1' });
    fetchTags();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchTags(); }
  };

  const openEdit = (tag: any) => {
    setSelectedTag(tag);
    setFormData({ name: tag.name, color: tag.color || '#6366f1' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">Label tickets with tags</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white" onClick={() => { setSelectedTag(null); setFormData({ name: '', color: '#6366f1' }); }}>
              <Plus className="mr-2 h-4 w-4" /> New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedTag ? 'Edit' : 'Create'} Tag</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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

      <Card className="bento-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No tags yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <Badge style={{ backgroundColor: tag.color, color: '#fff' }}>{tag.name}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(tag)}><Edit className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(tag.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTags;
