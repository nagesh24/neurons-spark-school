import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { BookMarked, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Subjects() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", color: "#6366f1" });

  const load = async () => {
    const { data } = await supabase.from("subjects").select("*").order("name");
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("subjects").insert({ name: form.name.trim(), code: form.code.trim() || null, color: form.color });
    if (error) return toast.error(error.message);
    toast.success("Subject added"); setOpen(false); setForm({ name: "", code: "", color: "#6366f1" }); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove subject?")) return;
    await supabase.from("subjects").delete().eq("id", id); load();
  };

  return (
    <div>
      <PageHeader
        title="Subjects" description="Curriculum subjects and color tags" icon={BookMarked}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add subject</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add subject</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Color</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <Card key={s.id} className="shadow-soft">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: s.color }}>
                  {s.code?.slice(0, 2) ?? s.name.slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{s.name}</p>
                  {s.code && <p className="text-xs text-muted-foreground font-mono">{s.code}</p>}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
