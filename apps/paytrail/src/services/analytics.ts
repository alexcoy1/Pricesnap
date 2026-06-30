import { listCommissionRuns } from './localStore';
import type { CommissionRun } from '../types';

export interface AnalyticsSummary {
  totalCommission: number;
  monthCommission: number;
  runCount: number;
  monthRunCount: number;
  avgCommission: number;
  byMonth: { label: string; total: number }[];
  topCustomers: { name: string; total: number; runs: number }[];
  recentRuns: CommissionRun[];
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const runs = listCommissionRuns(200);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthRuns = runs.filter((r) => new Date(r.created_at) >= monthStart);
  const totalCommission = runs.reduce((s, r) => s + Number(r.total_commission), 0);
  const monthCommission = monthRuns.reduce((s, r) => s + Number(r.total_commission), 0);

  const monthMap = new Map<string, number>();
  for (const run of runs) {
    const d = new Date(run.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(run.total_commission));
  }

  const byMonth = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, total]) => {
      const [y, m] = key.split('-');
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      return { label, total };
    });

  const customerMap = new Map<string, { name: string; total: number; runs: number }>();
  for (const run of runs) {
    const name = run.customers?.name ?? 'Unassigned';
    const cur = customerMap.get(name) ?? { name, total: 0, runs: 0 };
    cur.total += Number(run.total_commission);
    cur.runs += 1;
    customerMap.set(name, cur);
  }

  const topCustomers = [...customerMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalCommission,
    monthCommission,
    runCount: runs.length,
    monthRunCount: monthRuns.length,
    avgCommission: runs.length ? totalCommission / runs.length : 0,
    byMonth,
    topCustomers,
    recentRuns: runs.slice(0, 10),
  };
}
