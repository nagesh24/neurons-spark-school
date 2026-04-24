import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Save, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Attendance() {
  const { primaryRole, user } = useAuth();
  const canMark = primaryRole === "admin" || primaryRole === "teacher";
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, "present" | "absent" | "late">>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("classes").select("*").order("name").then(({ data }) => {
      setClasses(data ?? []); if (data?.[0]) setClassId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const { data: ss } = await supabase.from("students").select("id, full_name, admission_no, roll_no").eq("class_id", classId).order("roll_no");
      setStudents(ss ?? []);
      const { data: existing } = await supabase.from("attendance").select("*").eq("class_id", classId).eq("date", date);
      const m: Record<string, any> = {};
      (existing ?? []).forEach((r: any) => (m[r.student_id] = r.status));
      setMarks(m);
      const { data: hist } = await supabase.from("attendance").select("date, status, students(full_name)").eq("class_id", classId).order("date", { ascending: false }).limit(50);
      setHistory(hist ?? []);
    })();
  }, [classId, date]);

  const setMark = (sid: string, status: "present" | "absent" | "late") =>
    setMarks((m) => ({ ...m, [sid]: status }));

  const save = async () => {
    const rows = students.map((s) => ({
      student_id: s.id,
      class_id: classId,
      date,
      status: marks[s.id] ?? "absent",
      marked_by: user?.id ?? null,
    }));
    // upsert by (student_id, date) UNIQUE
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date" });
    if (error) return toast.error(error.message);
    toast.success("Attendance saved");
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Mark and review daily attendance per class" icon={ClipboardCheck} />

      <Card className="shadow-soft mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs text-muted-foreground">Class</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>Class {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {canMark && <Button onClick={save}><Save className="h-4 w-4 mr-2" />Save</Button>}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Adm. no</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">No students in this class.</TableCell></TableRow>
              )}
              {students.map((s) => {
                const status = marks[s.id];
                return (
                  <TableRow key={s.id}>
                    <TableCell>{s.roll_no ?? "—"}</TableCell>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.admission_no}</TableCell>
                    <TableCell>
                      {canMark ? (
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant={status === "present" ? "default" : "outline"}
                            className={status === "present" ? "bg-success hover:bg-success/90" : ""}
                            onClick={() => setMark(s.id, "present")}>
                            <Check className="h-3.5 w-3.5 mr-1" />Present
                          </Button>
                          <Button size="sm" variant={status === "absent" ? "destructive" : "outline"}
                            onClick={() => setMark(s.id, "absent")}>
                            <X className="h-3.5 w-3.5 mr-1" />Absent
                          </Button>
                          <Button size="sm" variant={status === "late" ? "default" : "outline"}
                            className={status === "late" ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""}
                            onClick={() => setMark(s.id, "late")}>
                            <Clock className="h-3.5 w-3.5 mr-1" />Late
                          </Button>
                        </div>
                      ) : (
                        <Badge className={status === "present" ? "bg-success" : status === "absent" ? "bg-destructive" : status === "late" ? "bg-warning text-warning-foreground" : "bg-muted"}>
                          {status ?? "not marked"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="shadow-soft mt-6">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold mb-3">Recent history</h3>
            <div className="grid gap-1 max-h-64 overflow-y-auto">
              {history.slice(0, 20).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{(h as any).students?.full_name}</span>
                  <span className="text-muted-foreground">{h.date}</span>
                  <Badge className={h.status === "present" ? "bg-success" : "bg-destructive"}>{h.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
