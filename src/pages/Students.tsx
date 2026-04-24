import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus, Trash2, Search, Pencil, Link2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  admission_no: z.string().trim().min(1).max(50),
  class_id: z.string().uuid().optional().or(z.literal("none")),
  roll_no: z.string().trim().max(20).optional().or(z.literal("")),
  parent_name: z.string().trim().max(100).optional().or(z.literal("")),
  parent_phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

const emptyForm = { full_name: "", admission_no: "", class_id: "none", roll_no: "", parent_name: "", parent_phone: "", email: "" };

export default function Students() {
  const { primaryRole } = useAuth();
  const isAdmin = primaryRole === "admin";
  const [list, setList] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [linkOpen, setLinkOpen] = useState<any | null>(null);
  const [linkUserId, setLinkUserId] = useState<string>("");

  const load = async () => {
    const { data } = await supabase.from("students").select("*, classes(name, grade_level)").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("classes").select("*").order("name").then(({ data }) => setClasses(data ?? []));
    if (isAdmin) {
      supabase.from("profiles").select("id, full_name").order("full_name").then(({ data }) => setProfiles(data ?? []));
    }
  }, [isAdmin]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      full_name: s.full_name ?? "",
      admission_no: s.admission_no ?? "",
      class_id: s.class_id ?? "none",
      roll_no: s.roll_no ?? "",
      parent_name: s.parent_name ?? "",
      parent_phone: s.parent_phone ?? "",
      email: s.email ?? "",
    });
    setOpen(true);
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const payload: any = { ...parsed.data };
    if (!payload.class_id || payload.class_id === "none") payload.class_id = null;
    ["roll_no", "parent_name", "parent_phone", "email"].forEach((k) => { if (payload[k] === "") payload[k] = null; });
    const { error } = editId
      ? await supabase.from("students").update(payload).eq("id", editId)
      : await supabase.from("students").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editId ? "Student updated" : "Student added");
    setOpen(false); setForm(emptyForm); setEditId(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this student?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };

  const linkAccount = async () => {
    if (!linkOpen) return;
    const userId = linkUserId === "none" ? null : linkUserId;
    const { error } = await supabase.from("students").update({ user_id: userId }).eq("id", linkOpen.id);
    if (error) return toast.error(error.message);
    toast.success(userId ? "Account linked" : "Account unlinked");
    setLinkOpen(null); setLinkUserId(""); load();
  };

  const filtered = list.filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || s.class_id === classFilter;
    return matchSearch && matchClass;
  });

  return (
    <div>
      <PageHeader
        title="Students" description="Enrollment, class assignment, and profiles" icon={GraduationCap}
        actions={isAdmin && (
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add student</Button>
        )}
      />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit student" : "Add student"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Full name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Admission no *</Label><Input value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} /></div>
              <div><Label>Roll no</Label><Input value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} /></div>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>Class {c.name} {c.grade_level ? `· ${c.grade_level}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Parent name</Label><Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} /></div>
              <div><Label>Parent phone</Label><Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} /></div>
            </div>
            <div><Label>Email (used to auto-link student account on signup)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit}>{editId ? "Save changes" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkOpen} onOpenChange={(v) => { if (!v) { setLinkOpen(null); setLinkUserId(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link account · {linkOpen?.full_name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Label>Connect this student record to a signed-up user account</Label>
            <Select value={linkUserId} onValueChange={setLinkUserId}>
              <SelectTrigger><SelectValue placeholder="Select user…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Unlink —</SelectItem>
                {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Once linked, the student will see their own attendance, fees, and reports on their portal.</p>
          </div>
          <DialogFooter><Button onClick={linkAccount}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name or admission no…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>Class {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Adm. no</TableHead><TableHead>Class</TableHead>
                <TableHead>Roll</TableHead><TableHead>Parent</TableHead>
                <TableHead>Account</TableHead>
                {isAdmin && <TableHead className="w-32"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No students.</TableCell></TableRow>
              )}
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.admission_no}</TableCell>
                  <TableCell>{s.classes ? <Badge variant="secondary">Class {s.classes.name}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{s.roll_no ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.parent_name ?? "—"} {s.parent_phone && `· ${s.parent_phone}`}</TableCell>
                  <TableCell>
                    {s.user_id ? <Badge variant="outline" className="gap-1"><Link2 className="h-3 w-3" />Linked</Badge>
                      : <Badge variant="outline" className="gap-1 text-muted-foreground"><Link2Off className="h-3 w-3" />—</Badge>}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(s)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setLinkOpen(s); setLinkUserId(s.user_id ?? ""); }} title="Link account">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(s.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
