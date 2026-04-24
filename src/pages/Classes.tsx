import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Classes() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", grade_level: "" });
  const [assignTeacher, setAssignTeacher] = useState<string>("");

  const load = async () => {
    const [c, t, ct] = await Promise.all([
      supabase.from("classes").select("*").order("name"),
      supabase.from("teachers").select("id, full_name, employee_id"),
      supabase.from("class_teachers").select("*, teachers(full_name)"),
    ]);
    setClasses(c.data ?? []); setTeachers(t.data ?? []); setAssignments(ct.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const addClass = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("classes").insert({ name: form.name.trim(), grade_level: form.grade_level.trim() || null });
    if (error) return toast.error(error.message);
    toast.success("Class added"); setOpen(false); setForm({ name: "", grade_level: "" }); load();
  };

  const removeClass = async (id: string) => {
    if (!confirm("Remove class?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const assign = async (classId: string) => {
    if (!assignTeacher) return toast.error("Pick a teacher");
    const { error } = await supabase.from("class_teachers").insert({ class_id: classId, teacher_id: assignTeacher });
    if (error) return toast.error(error.message);
    toast.success("Assigned"); setAssignOpen(null); setAssignTeacher(""); load();
  };

  const unassign = async (id: string) => {
    await supabase.from("class_teachers").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Classes" description="Sections A, B, C, D and teacher assignments" icon={BookOpen}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add class</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="A" /></div>
                <div><Label>Grade level</Label><Input value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} placeholder="Grade 5" /></div>
              </div>
              <DialogFooter><Button onClick={addClass}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {classes.map((c) => {
          const a = assignments.filter((x) => x.class_id === c.id);
          return (
            <Card key={c.id} className="shadow-soft hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-2xl">Class {c.name}</CardTitle>
                    {c.grade_level && <p className="text-xs text-muted-foreground mt-1">{c.grade_level}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeClass(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Teachers</p>
                {a.length === 0 && <p className="text-xs text-muted-foreground italic">None assigned</p>}
                {a.map((x) => (
                  <div key={x.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-2 py-1">
                    <span>{x.teachers?.full_name}</span>
                    <button className="text-destructive text-xs" onClick={() => unassign(x.id)}>×</button>
                  </div>
                ))}
                <Dialog open={assignOpen === c.id} onOpenChange={(o) => setAssignOpen(o ? c.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <UserPlus className="h-3.5 w-3.5 mr-2" />Assign teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Assign teacher to Class {c.name}</DialogTitle></DialogHeader>
                    <Select value={assignTeacher} onValueChange={setAssignTeacher}>
                      <SelectTrigger><SelectValue placeholder="Choose teacher" /></SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name} ({t.employee_id})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <DialogFooter><Button onClick={() => assign(c.id)}>Assign</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
