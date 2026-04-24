import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Notices() {
  const { primaryRole, user } = useAuth();
  const canPost = primaryRole === "admin" || primaryRole === "teacher";
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const empty = { title: "", body: "", audience: "both" as "teachers" | "students" | "both" };
  const [form, setForm] = useState(empty);

  const load = async () => {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body required");
    const { error } = await supabase.from("notices").insert({ ...form, posted_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Notice posted"); setOpen(false); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("notices").delete().eq("id", id); load();
  };

  return (
    <div>
      <PageHeader
        title="Notices" description="Announcements for teachers, students or both" icon={Megaphone}
        actions={canPost && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Post notice</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New notice</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Body *</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                <div>
                  <Label>Audience</Label>
                  <Select value={form.audience} onValueChange={(v: any) => setForm({ ...form, audience: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Teachers & Students</SelectItem>
                      <SelectItem value="teachers">Teachers only</SelectItem>
                      <SelectItem value="students">Students only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={submit}>Post</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="grid gap-3">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No notices yet.</p>}
        {list.map((n) => (
          <Card key={n.id} className="shadow-soft border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="capitalize">{n.audience}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="font-display font-semibold text-lg">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</p>
                </div>
                {canPost && (n.posted_by === user?.id || primaryRole === "admin") && (
                  <Button size="icon" variant="ghost" onClick={() => remove(n.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
