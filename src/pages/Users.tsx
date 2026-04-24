import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Search } from "lucide-react";

type Row = {
  id: string;
  full_name: string;
  created_at: string;
  roles: AppRole[];
};

const ROLE_OPTIONS: AppRole[] = ["admin", "teacher", "student"];

export default function Users() {
  const { primaryRole, user: currentUser } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role);
      byUser.set(r.user_id, arr);
    });
    setRows(
      (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || "(no name)",
        created_at: p.created_at,
        roles: byUser.get(p.id) ?? [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (primaryRole === "admin") load();
  }, [primaryRole]);

  const setRole = async (userId: string, newRole: AppRole) => {
    setBusy(userId);
    // Replace all roles with the new single role for simplicity
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { setBusy(null); return toast.error(delErr.message); }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    setBusy(null);
    if (insErr) return toast.error(insErr.message);
    toast.success(`Role updated to ${newRole}`);
    load();
  };

  if (primaryRole !== "admin") {
    return (
      <div>
        <PageHeader title="User Roles" description="Admin access required." />
        <Card><CardContent className="p-6 text-muted-foreground">You need admin privileges to view this page.</CardContent></Card>
      </div>
    );
  }

  const filtered = rows.filter(
    (r) => r.full_name.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q)
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Roles"
        description="Promote signed-up users to teacher or admin. Each user has one role."
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Current role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Change role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const role = (r.roles[0] ?? "student") as AppRole;
                    const isMe = r.id === currentUser?.id;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.full_name}
                          {isMe && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={role === "admin" ? "default" : role === "teacher" ? "secondary" : "outline"}
                            className="capitalize"
                          >
                            {role === "admin" && <ShieldCheck className="h-3 w-3 mr-1" />}
                            {role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Select
                              value={role}
                              onValueChange={(v) => setRole(r.id, v as AppRole)}
                              disabled={busy === r.id || isMe}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((o) => (
                                  <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {busy === r.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Tip: you can't change your own role (to avoid locking yourself out). Ask another admin if needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
