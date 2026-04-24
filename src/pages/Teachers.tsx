import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, Search, Pencil, Link2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  employee_id: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  qualification: z.string().trim().max(200).optional().or(z.literal("")),
  subject_id: z.string().uuid().optional().or(z.literal("none")),
});

const emptyForm = { full_name: "", employee_id: "", email: "", phone: "", qualification: "", subject_id: "none" };

export default function Teachers() {
  const { primaryRole } = useAuth();
  const isAdmin = primaryRole === "admin";
  const [list, setList] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [linkOpen, setLinkOpen] = useState<any | null>(null);
  const [linkUserId, setLinkUserId] = useState<string>("");

  const load = async () => {
    const { data } = await supabase.from("teachers").select("*, subjects(name, color)").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("subjects").select("*").then(({ data }) => setSubjects(data ?? []));
    if (isAdmin) {
      supabase.from("profiles").select("id, full_name").order("full_name").then(({ data }) => setProfiles(data ?? []));
    }
  }, [isAdmin]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({
      full_name: t.full_name ?? "",
      employee_id: t.employee_id ?? "",
      email: t.email ?? "",
      phone: t.phone ?? "",
      qualification: t.qualification ?? "",
      subject_id: t.subject_id ?? "none",
    });
    setOpen(true);
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const payload: any = { ...parsed.data };
    if (!payload.subject_id || payload.subject_id === "none") payload.subject_id = null;
    ["email", "phone", "qualification"].forEach((k) => { if (payload[k] === "") payload[k] = null; });
    const { error } = editId
      ? await supabase.from("teachers").update(payload).eq("id", editId)
      : await supabase.from("teachers").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editId ? "Teacher updated" : "Teacher added");
    setOpen(false); setForm(emptyForm); setEditId(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this teacher?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const linkAccount = async () => {
    if (!linkOpen) return;
    const userId = linkUserId === "none" ? null : linkUserId;
    const { error } = await supabase.from("teachers").update({ user_id: userId }).eq("id", linkOpen.id);
    if (error) return toast.error(error.message);

    // If linking, also ensure they have the teacher role
    if (userId) {
      await supabase.from("user_roles").upsert(
        { user_id: userId, role: "teacher" },
        { onConflict: "user_id,role" }
      );
    }
    toast.success(userId ? "Account linked & promoted to teacher" : "Account unlinked");
    setLinkOpen(null); setLinkUserId(""); load();
  };

  const filtered = list.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Teachers" description="Manage faculty and subject assignments" icon={Users}
        actions={isAdmin && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add teacher</Button>}
      />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit teacher" : "Add teacher"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Full name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Employee ID *</Label><Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Email (used to auto-link teacher account on signup)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={submit}>{editId ? "Save changes" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkOpen} onOpenChange={(v) => { if (!v) { setLinkOpen(null); setLinkUserId(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link account · {linkOpen?.full_name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Label>Connect this teacher record to a signed-up user account</Label>
            <Select value={linkUserId} onValueChange={setLinkUserId}>
              <SelectTrigger><SelectValue placeholder="Select user…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Unlink —</SelectItem>
                {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Linking automatically promotes the user to teacher role.</p>
          </div>
          <DialogFooter><Button onClick={linkAccount}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Employee ID</TableHead><TableHead>Subject</TableHead>
                <TableHead>Email</TableHead><TableHead>Phone</TableHead>
                <TableHead>Account</TableHead>
                {isAdmin && <TableHead className="w-32"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No teachers yet.</TableCell></TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.full_name}</TableCell>
                  <TableCell><span className="font-mono text-xs">{t.employee_id}</span></TableCell>
                  <TableCell>{t.subjects?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{t.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.phone ?? "—"}</TableCell>
                  <TableCell>
                    {t.user_id ? <Badge variant="outline" className="gap-1"><Link2 className="h-3 w-3" />Linked</Badge>
                      : <Badge variant="outline" className="gap-1 text-muted-foreground"><Link2Off className="h-3 w-3" />—</Badge>}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(t)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setLinkOpen(t); setLinkUserId(t.user_id ?? ""); }} title="Link account">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(t.id)} title="Delete">
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
