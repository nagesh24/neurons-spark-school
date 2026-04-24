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
import { Wallet, Plus, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export default function Fees() {
  const { primaryRole, user } = useAuth();
  const isAdmin = primaryRole === "admin";
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const empty = { student_id: "", net_amount: "", due_date: "", notes: "" };
  const [form, setForm] = useState(empty);
  const [payAmount, setPayAmount] = useState("");

  const load = async () => {
    const { data } = await supabase.from("fees").select("*, students(full_name, admission_no, classes(name))").order("created_at", { ascending: false });
    setFees(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("students").select("id, full_name, admission_no").order("full_name").then(({ data }) => setStudents(data ?? []));
  }, []);

  const submit = async () => {
    if (!form.student_id || !form.net_amount) return toast.error("Student and amount required");
    const { error } = await supabase.from("fees").insert({
      student_id: form.student_id,
      net_amount: Number(form.net_amount),
      due_date: form.due_date || null,
      notes: form.notes || null,
      status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Fee assigned"); setOpen(false); setForm(empty); load();
  };

  const recordPayment = async (feeId: string) => {
    const fee = fees.find((f) => f.id === feeId);
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return toast.error("Enter amount");
    const newPaid = Number(fee.paid_amount) + amt;
    const status = newPaid >= Number(fee.net_amount) ? "paid" : "partial";
    const { error: e1 } = await supabase.from("fee_payments").insert({ fee_id: feeId, amount: amt, recorded_by: user?.id });
    const { error: e2 } = await supabase.from("fees").update({ paid_amount: newPaid, status }).eq("id", feeId);
    if (e1 || e2) return toast.error((e1 || e2)!.message);
    toast.success("Payment recorded"); setPayOpen(null); setPayAmount(""); load();
  };

  const totalNet = fees.reduce((a, f) => a + Number(f.net_amount), 0);
  const totalPaid = fees.reduce((a, f) => a + Number(f.paid_amount), 0);
  const totalPending = totalNet - totalPaid;

  const statusTone = (s: string) =>
    s === "paid" ? "bg-success" : s === "partial" ? "bg-warning" : s === "overdue" ? "bg-destructive" : "bg-muted text-foreground";

  return (
    <div>
      <PageHeader
        title="Fees" description="Assignment, payments and balances" icon={Wallet}
        actions={isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Assign fee</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign fee</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Student *</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick student" /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Net amount *</Label><Input type="number" value={form.net_amount} onChange={(e) => setForm({ ...form, net_amount: e.target.value })} /></div>
                  <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                </div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <Card className="shadow-soft"><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Net</p><p className="font-display text-2xl font-bold">₹{totalNet.toLocaleString()}</p></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Collected</p><p className="font-display text-2xl font-bold text-success">₹{totalPaid.toLocaleString()}</p></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Pending</p><p className="font-display text-2xl font-bold text-warning">₹{totalPending.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Net</TableHead>
                <TableHead>Paid</TableHead><TableHead>Pending</TableHead><TableHead>Status</TableHead>
                {isAdmin && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No fee records.</TableCell></TableRow>}
              {fees.map((f) => {
                const pending = Number(f.net_amount) - Number(f.paid_amount);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.students?.full_name}</TableCell>
                    <TableCell>{f.students?.classes?.name ? `Class ${f.students.classes.name}` : "—"}</TableCell>
                    <TableCell>₹{Number(f.net_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-success">₹{Number(f.paid_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-warning">₹{pending.toLocaleString()}</TableCell>
                    <TableCell><Badge className={statusTone(f.status)}>{f.status}</Badge></TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Dialog open={payOpen === f.id} onOpenChange={(o) => { setPayOpen(o ? f.id : null); setPayAmount(""); }}>
                          <DialogTrigger asChild><Button size="sm" variant="outline"><IndianRupee className="h-3.5 w-3.5 mr-1" />Pay</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
                            <Label>Amount</Label>
                            <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={`Up to ${pending}`} />
                            <DialogFooter><Button onClick={() => recordPayment(f.id)}>Record</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
