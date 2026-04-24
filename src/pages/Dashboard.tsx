import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, ClipboardCheck, Wallet, BookOpen, Megaphone, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stat { label: string; value: string | number; icon: any; tone: string; sub?: string; }

function StatCard({ s }: { s: Stat }) {
  return (
    <Card className="shadow-soft hover:shadow-elevated transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
            <p className="font-display text-3xl font-bold mt-2">{s.value}</p>
            {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.tone}`}>
            <s.icon className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { primaryRole, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    teachers: 0, students: 0, classes: 0, attendanceToday: 0, feesCollected: 0, feesPending: 0,
    homework: 0, notices: 0,
  });
  const [recentNotices, setRecentNotices] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [t, s, c, a, f, h, n, rn] = await Promise.all([
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("attendance").select("status", { count: "exact" }).eq("date", today).eq("status", "present"),
        supabase.from("fees").select("net_amount,paid_amount"),
        supabase.from("homework").select("*", { count: "exact", head: true }),
        supabase.from("notices").select("*", { count: "exact", head: true }),
        supabase.from("notices").select("id,title,body,created_at,audience").order("created_at", { ascending: false }).limit(4),
      ]);
      const totals = (f.data ?? []).reduce(
        (acc: any, r: any) => {
          acc.net += Number(r.net_amount); acc.paid += Number(r.paid_amount); return acc;
        }, { net: 0, paid: 0 }
      );
      setCounts({
        teachers: t.count ?? 0,
        students: s.count ?? 0,
        classes: c.count ?? 0,
        attendanceToday: a.count ?? 0,
        feesCollected: totals.paid,
        feesPending: Math.max(0, totals.net - totals.paid),
        homework: h.count ?? 0,
        notices: n.count ?? 0,
      });
      setRecentNotices(rn.data ?? []);
      setLoading(false);
    })();
  }, []);

  const adminStats: Stat[] = [
    { label: "Teachers",  value: counts.teachers,  icon: Users,          tone: "gradient-primary" },
    { label: "Students",  value: counts.students,  icon: GraduationCap,  tone: "bg-accent" },
    { label: "Classes",   value: counts.classes,   icon: BookOpen,       tone: "bg-secondary" },
    { label: "Present today", value: counts.attendanceToday, icon: ClipboardCheck, tone: "bg-success" },
    { label: "Fees collected", value: `₹${counts.feesCollected.toLocaleString()}`, icon: Wallet, tone: "gradient-primary" },
    { label: "Fees pending",   value: `₹${counts.feesPending.toLocaleString()}`,   icon: TrendingUp, tone: "bg-warning" },
    { label: "Homework posts", value: counts.homework, icon: BookOpen, tone: "bg-accent" },
    { label: "Notices",        value: counts.notices,  icon: Megaphone, tone: "bg-secondary" },
  ];

  const teacherStats: Stat[] = adminStats.slice(1, 5);
  const studentStats: Stat[] = [
    { label: "My homework",   value: counts.homework, icon: BookOpen, tone: "gradient-primary" },
    { label: "Notices",       value: counts.notices,  icon: Megaphone, tone: "bg-accent" },
    { label: "Fees pending",  value: `₹${counts.feesPending.toLocaleString()}`, icon: Wallet, tone: "bg-warning" },
  ];
  const stats = primaryRole === "admin" ? adminStats : primaryRole === "teacher" ? teacherStats : studentStats;

  const greet = primaryRole === "admin" ? "Admin overview" : primaryRole === "teacher" ? "Teacher dashboard" : "Student dashboard";

  return (
    <div>
      <PageHeader
        title={`Welcome back${user?.email ? `, ${user.email.split("@")[0]}` : ""}`}
        description={greet}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} s={s} />)}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-display">Recent notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotices.length === 0 && (
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            )}
            {recentNotices.map((n) => (
              <div key={n.id} className="border-l-2 border-primary pl-3 py-1">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                  {n.audience} · {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft gradient-hero text-white">
          <CardHeader><CardTitle className="text-base font-display text-white">Neurons International</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-white/80">A modern, secure school management portal — manage teachers, students, attendance, homework, notices, fees, and reports in one place.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
