import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, BookOpen, Trash2, Edit, Eye, EyeOff, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const AdminKnowledgeBase: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    published: false,
  });

  const fetchData = async () => {
    setLoading(true);
    const [articlesRes, categoriesRes] = await Promise.all([
      supabase.from('knowledge_base_articles').select('*, category:categories(name), author:profiles!knowledge_base_articles_created_by_fkey(name)').order('updated_at', { ascending: false }),
      supabase.from('categories').select('*'),
    ]);
    setArticles(articlesRes.data || []);
    setCategories(categoriesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    const payload = {
      ...formData,
      category_id: formData.category_id || null,
      created_by: user?.id,
    };

    if (selectedArticle) {
      const { error } = await supabase.from('knowledge_base_articles').update(payload).eq('id', selectedArticle.id);
      if (error) toast.error('Failed to update');
      else toast.success('Article updated');
    } else {
      const { error } = await supabase.from('knowledge_base_articles').insert(payload);
      if (error) toast.error('Failed to create');
      else toast.success('Article created');
    }

    setDialogOpen(false);
    setSelectedArticle(null);
    setFormData({ title: '', content: '', category_id: '', published: false });
    fetchData();
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    const { error } = await supabase.from('knowledge_base_articles').update({ published }).eq('id', id);
    if (error) toast.error('Failed to update');
    else fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('knowledge_base_articles').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchData(); }
  };

  const openEdit = (article: any) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category_id: article.category_id || '',
      published: article.published,
    });
    setDialogOpen(true);
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage help articles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white" onClick={() => { setSelectedArticle(null); setFormData({ title: '', content: '', category_id: '', published: false }); }}>
              <Plus className="mr-2 h-4 w-4" /> New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selectedArticle ? 'Edit' : 'Create'} Article</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  placeholder="Write your article content here... (Markdown supported)"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.published} onCheckedChange={(v) => setFormData({ ...formData, published: v })} />
                <Label>Publish immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gradient-primary text-white">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 max-w-md" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredArticles.length === 0 ? (
        <Card className="bento-card">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No articles yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="bento-card">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{article.title}</h3>
                      {article.category && <Badge variant="outline">{article.category.name}</Badge>}
                      <Badge variant={article.published ? 'default' : 'secondary'}>
                        {article.published ? <><Eye className="h-3 w-3 mr-1" /> Published</> : <><EyeOff className="h-3 w-3 mr-1" /> Draft</>}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      By {article.author?.name || 'Unknown'} • Updated {format(new Date(article.updated_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={article.published} onCheckedChange={(v) => handleTogglePublish(article.id, v)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(article)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default AdminKnowledgeBase;
