import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Homework() {
  const { primaryRole, user } = useAuth();
  const canPost = primaryRole === "admin" || primaryRole === "teacher";
  const [list, setList] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const empty = { class_id: "", subject_id: "none", title: "", description: "", due_date: "" };
  const [form, setForm] = useState(empty);

  const load = async () => {
    const { data } = await supabase.from("homework").select("*, classes(name), subjects(name, color)").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("classes").select("*").order("name").then(({ data }) => setClasses(data ?? []));
    supabase.from("subjects").select("*").then(({ data }) => setSubjects(data ?? []));
  }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.class_id) return toast.error("Title and class required");
    const payload: any = {
      class_id: form.class_id,
      subject_id: form.subject_id === "none" ? null : form.subject_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      posted_by: user?.id,
    };
    const { error } = await supabase.from("homework").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Homework posted"); setOpen(false); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("homework").delete().eq("id", id); load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const todays = list.filter((h) => h.created_at?.slice(0, 10) === today);
  const previous = list.filter((h) => h.created_at?.slice(0, 10) !== today);

  const renderItem = (h: any) => (
    <Card key={h.id} className="shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary">Class {h.classes?.name}</Badge>
              {h.subjects && (
                <Badge style={{ backgroundColor: h.subjects.color, color: "#fff" }}>{h.subjects.name}</Badge>
              )}
              {h.due_date && <span className="text-xs text-muted-foreground">Due {h.due_date}</span>}
            </div>
            <p className="font-display font-semibold">{h.title}</p>
            {h.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{h.description}</p>}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">Posted {new Date(h.created_at).toLocaleString()}</p>
          </div>
          {canPost && (
            <Button size="icon" variant="ghost" onClick={() => remove(h.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Homework" description="Today's assignments and previous archive" icon={FileText}
        actions={canPost && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Post homework</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Post homework</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Class *</Label>
                    <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>Class {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Post</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <Tabs defaultValue="today">
        <TabsList><TabsTrigger value="today">Today</TabsTrigger><TabsTrigger value="archive">Archive</TabsTrigger></TabsList>
        <TabsContent value="today" className="space-y-3 mt-4">
          {todays.length === 0 && <p className="text-sm text-muted-foreground">No homework posted today.</p>}
          {todays.map(renderItem)}
        </TabsContent>
        <TabsContent value="archive" className="space-y-3 mt-4">
          {previous.length === 0 && <p className="text-sm text-muted-foreground">Archive is empty.</p>}
          {previous.map(renderItem)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
