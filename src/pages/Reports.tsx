import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Plus } from "lucide-react";
import { toast } from "sonner";

const GRADES = ["W", "R", "U", "AD"] as const;

export default function Reports() {
  const { primaryRole, user } = useAuth();
  const canCreate = primaryRole === "admin" || primaryRole === "teacher";
  const [reports, setReports] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const empty = { student_id: "", subject_id: "", term: "Term 1", percentage: "", grade: "W" as typeof GRADES[number], remarks: "" };
  const [form, setForm] = useState(empty);

  const load = async () => {
    const { data } = await supabase.from("reports").select("*, students(full_name, admission_no), subjects(name, color)").order("created_at", { ascending: false });
    setReports(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("students").select("id, full_name, admission_no").order("full_name").then(({ data }) => setStudents(data ?? []));
    supabase.from("subjects").select("*").then(({ data }) => setSubjects(data ?? []));
  }, []);

  const submit = async () => {
    if (!form.student_id || !form.subject_id) return toast.error("Student & subject required");
    const { error } = await supabase.from("reports").insert({
      student_id: form.student_id,
      subject_id: form.subject_id,
      term: form.term,
      percentage: form.percentage ? Number(form.percentage) : null,
      grade: form.grade,
      remarks: form.remarks || null,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Report saved"); setOpen(false); setForm(empty); load();
  };

  const filtered = filterStudent === "all" ? reports : reports.filter((r) => r.student_id === filterStudent);

  // group by student for summary
  const grouped: Record<string, any[]> = {};
  filtered.forEach((r) => {
    const key = r.students?.full_name ?? "Unknown";
    grouped[key] = grouped[key] ?? []; grouped[key].push(r);
  });

  return (
    <div>
      <PageHeader
        title="Performance reports" description="Subject-wise grades (W, R, U, A.D) and percentages" icon={BarChart3}
        actions={canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add report</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add subject report</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Student *</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Subject *</Label>
                    <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Term</Label><Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Percentage</Label><Input type="number" min="0" max="100" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} /></div>
                  <div>
                    <Label>Grade</Label>
                    <Select value={form.grade} onValueChange={(v: any) => setForm({ ...form, grade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g === "AD" ? "A.D" : g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Remarks</Label><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <Card className="shadow-soft mb-4">
        <CardContent className="p-4">
          <Label>Filter by student</Label>
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger className="max-w-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {Object.keys(grouped).length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}

      <div className="grid gap-4">
        {Object.entries(grouped).map(([name, rows]) => {
          const avg = rows.filter((r) => r.percentage != null).reduce((a, r) => a + Number(r.percentage), 0) / Math.max(1, rows.filter((r) => r.percentage != null).length);
          return (
            <Card key={name} className="shadow-soft">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="font-display">{name}</CardTitle>
                <Badge className="gradient-primary text-primary-foreground">Avg {isFinite(avg) ? avg.toFixed(1) : "—"}%</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Term</TableHead><TableHead>Percentage</TableHead><TableHead>Grade</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell><Badge style={{ backgroundColor: r.subjects?.color, color: "#fff" }}>{r.subjects?.name}</Badge></TableCell>
                        <TableCell>{r.term}</TableCell>
                        <TableCell>{r.percentage ?? "—"}{r.percentage != null && "%"}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono">{r.grade === "AD" ? "A.D" : r.grade}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{r.remarks ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
