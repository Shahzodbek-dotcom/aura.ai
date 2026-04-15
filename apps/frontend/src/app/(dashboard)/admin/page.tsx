"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Shield, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearStoredSession, getStoredAccessToken, persistSession } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";
import { downloadAdminExport, getAdminOverview, getCurrentUser, type AdminOverview } from "@/lib/api";

function formatNumber(value: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(value);
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    void getCurrentUser()
      .then(async (validatedUser) => {
        if (!validatedUser.is_admin) {
          router.replace("/dashboard");
          return;
        }

        persistSession(token, validatedUser);
        setUser(validatedUser);
        const adminOverview = await getAdminOverview();
        setOverview(adminOverview);
      })
      .catch((loadError) => {
        clearStoredSession();
        const message =
          loadError instanceof Error ? loadError.message : "Admin panelni yuklab bo'lmadi.";
        setError(message);
        router.replace("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  async function handleExport() {
    try {
      setExporting(true);
      const blob = await downloadAdminExport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "aura-admin-export.xlsx";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Excel fayl yuklab olindi.");
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : "Excel export ishlamadi.";
      setError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-background px-4 py-10">Admin panel yuklanmoqda...</main>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-muted">Admin panel</p>
              <h1 className="mt-3 font-display text-4xl">Foydalanuvchilar va eksport</h1>
              <p className="mt-3 text-sm text-muted">
                Bu sahifada ro&apos;yxatdan o&apos;tgan foydalanuvchilar, xarajatlar va maqsadlar
                bo&apos;yicha umumiy ko&apos;rinishni ko&apos;rasiz.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button onClick={() => void handleExport()} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Yuklanmoqda..." : "Excel export"}
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[24px] border border-accent/30 bg-accent/10 px-5 py-4 text-sm">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            icon={<Users className="h-5 w-5" />}
            title="Jami foydalanuvchilar"
            value={formatNumber(overview?.total_users ?? 0)}
          />
          <SummaryCard
            icon={<Wallet className="h-5 w-5" />}
            title="Jami transaction"
            value={formatNumber(overview?.total_transactions ?? 0)}
          />
          <SummaryCard
            icon={<Download className="h-5 w-5" />}
            title="Jami daromad"
            value={formatNumber(overview?.total_income ?? 0)}
          />
          <SummaryCard
            icon={<Shield className="h-5 w-5" />}
            title="Jami goals"
            value={formatNumber(overview?.total_goals ?? 0)}
          />
          <SummaryCard
            icon={<Wallet className="h-5 w-5" />}
            title="Jami sarf"
            value={formatNumber(overview?.total_spent ?? 0)}
          />
        </section>

        <Card className="border-border/70">
          <CardContent className="p-0">
            <div className="border-b border-border/70 px-6 py-5">
              <h2 className="font-display text-2xl">Foydalanuvchilar ro&apos;yxati</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary/35 text-left text-muted">
                  <tr>
                    <th className="px-4 py-3">Ism</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Holat</th>
                    <th className="px-4 py-3">Sana</th>
                    <th className="px-4 py-3">Transaction</th>
                    <th className="px-4 py-3">Daromad</th>
                    <th className="px-4 py-3">Sarf</th>
                    <th className="px-4 py-3">Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.users.map((row) => (
                    <tr key={row.id} className="border-t border-border/50">
                      <td className="px-4 py-3 font-medium">{row.full_name}</td>
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="px-4 py-3">{row.is_active ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{formatNumber(row.transaction_count)}</td>
                      <td className="px-4 py-3">{formatNumber(row.total_income)}</td>
                      <td className="px-4 py-3">{formatNumber(row.total_spent)}</td>
                      <td className="px-4 py-3">{formatNumber(row.goal_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted">
          Admin email: <span className="font-medium text-foreground">{user?.email}</span>
        </p>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-3 p-5">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
        <p className="text-sm text-muted">{title}</p>
        <p className="font-display text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}
