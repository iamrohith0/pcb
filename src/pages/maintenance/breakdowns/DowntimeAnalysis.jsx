// src/pages/maintenance/breakdowns/DowntimeAnalysis.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
    Activity,
    AlertTriangle,
    Clock,
    Download,
    Filter,
    RefreshCw,
    Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * DowntimeAnalysis.jsx (PCBxpress - PCB Manufacturing ERP)
 * Purpose:
 * - Analyze breakdown downtime by machine/line/plant
 * - Track MTTR, MTBF, total downtime, and major reasons
 * - Show event list + reason Pareto + machine downtime bars
 *
 * Replace `mockFetch()` with real API integration when ready.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const minutes = (ms) => Math.round(ms / 60000);

const fmtMins = (m) => {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
};

const fmtDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

// ---- Mock Data (replace with API) ----
const MOCK_PLANTS = ["Plant A", "Plant B"];
const MOCK_LINES = ["CAM", "Drilling", "Plating", "Etching", "Soldermask", "AOI", "E-Test", "Routing"];
const MOCK_MACHINES = [
  { id: "DRL-01", name: "CNC Drill #1", line: "Drilling", plant: "Plant A" },
  { id: "DRL-02", name: "CNC Drill #2", line: "Drilling", plant: "Plant A" },
  { id: "PLT-01", name: "Plating Line #1", line: "Plating", plant: "Plant A" },
  { id: "ETC-01", name: "Etching Line #1", line: "Etching", plant: "Plant B" },
  { id: "AOI-01", name: "AOI Station #1", line: "AOI", plant: "Plant B" },
  { id: "ETS-01", name: "E-Test #1", line: "E-Test", plant: "Plant B" },
];

const MOCK_REASONS = [
  "Spindle Failure",
  "Air Pressure Low",
  "Pump Leakage",
  "Sensor Fault",
  "Chemical Refill Delay",
  "Tool Change / Setup",
  "PLC / Electrical",
  "Operator Error",
  "Preventive Maintenance",
];

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMockEvents(fromISO, toISO, plant, line, machineId) {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  const totalDays = Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)));

  const baseCount = Math.min(60, Math.max(8, totalDays * 6));
  const events = [];

  for (let i = 0; i < baseCount; i++) {
    const m = randomPick(MOCK_MACHINES);
    if (plant !== "all" && m.plant !== plant) continue;
    if (line !== "all" && m.line !== line) continue;
    if (machineId !== "all" && m.id !== machineId) continue;

    const start = new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));
    const durMin = Math.max(8, Math.round(10 + Math.random() * 180)); // 10m - 3h
    const end = new Date(start.getTime() + durMin * 60000);

    const severityRoll = Math.random();
    const severity = severityRoll > 0.88 ? "critical" : severityRoll > 0.62 ? "major" : "minor";

    events.push({
      id: `BD-${String(i + 1).padStart(4, "0")}`,
      plant: m.plant,
      line: m.line,
      machineId: m.id,
      machineName: m.name,
      reason: randomPick(MOCK_REASONS),
      severity,
      start: start.toISOString(),
      end: end.toISOString(),
      durationMin: durMin,
      ticket: Math.random() > 0.35 ? `MT-${1000 + i}` : null,
      action: Math.random() > 0.4 ? "Replaced part / calibrated" : "Checked & restarted",
      owner: Math.random() > 0.5 ? "Maintenance" : "Production",
    });
  }

  // Sort newest first
  return events.sort((a, b) => new Date(b.start) - new Date(a.start));
}

async function mockFetch({ fromISO, toISO, plant, line, machineId }) {
  // simulate network delay
  await new Promise((r) => setTimeout(r, 350));
  return buildMockEvents(fromISO, toISO, plant, line, machineId);
}

function SeverityBadge({ value }) {
  const map = {
    critical: "destructive",
    major: "default",
    minor: "secondary",
  };
  const label = value?.toUpperCase?.() ?? "N/A";
  return <Badge variant={map[value] ?? "outline"}>{label}</Badge>;
}

function StatCard({ title, value, sub, icon: Icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {sub ? <p className="text-xs text-gray-500">{sub}</p> : null}
        </div>
        <div className="rounded-xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function MiniBar({ label, valueMin, maxMin }) {
  const pct = maxMin <= 0 ? 0 : Math.min(100, Math.round((valueMin / maxMin) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm text-gray-700">{label}</p>
        <p className="shrink-0 text-sm font-medium text-gray-900">{fmtMins(valueMin)}</p>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-[#dc2551]"
          style={{ width: `${pct}%` }}
          aria-label={`${label} ${pct}%`}
        />
      </div>
    </div>
  );
}

export default function DowntimeAnalysis() {
  const { toast } = useToast();

  // Default: last 7 days
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const [plant, setPlant] = useState("all");
  const [line, setLine] = useState("all");
  const [machineId, setMachineId] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const machineOptions = useMemo(() => {
    return MOCK_MACHINES.filter((m) => (plant === "all" ? true : m.plant === plant))
      .filter((m) => (line === "all" ? true : m.line === line));
  }, [plant, line]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      return (
        e.id.toLowerCase().includes(q) ||
        e.machineId.toLowerCase().includes(q) ||
        e.machineName.toLowerCase().includes(q) ||
        e.reason.toLowerCase().includes(q) ||
        (e.ticket ?? "").toLowerCase().includes(q) ||
        (e.line ?? "").toLowerCase().includes(q) ||
        (e.plant ?? "").toLowerCase().includes(q)
      );
    });
  }, [events, search]);

  const metrics = useMemo(() => {
    const list = filteredEvents;

    const totalDownMin = list.reduce((sum, e) => sum + (e.durationMin || 0), 0);
    const count = list.length;

    // MTTR: avg downtime per event
    const mttrMin = count ? Math.round(totalDownMin / count) : 0;

    // MTBF (rough): avg time between failures
    // Using range minutes / (count) as a simplified approximation (real MTBF depends on run time & assets)
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T23:59:59`);
    const rangeMin = Math.max(1, minutes(to - from));
    const mtbfMin = count ? Math.round(rangeMin / count) : rangeMin;

    // OEE loss placeholder: downtime minutes / planned minutes
    // planned minutes approximated as rangeMin * 0.85 (assuming 85% planned production window)
    const plannedMin = Math.max(1, Math.round(rangeMin * 0.85));
    const oeeLossPct = Math.min(100, Math.round((totalDownMin / plannedMin) * 100));

    const criticalCount = list.filter((e) => e.severity === "critical").length;

    return {
      totalDownMin,
      count,
      mttrMin,
      mtbfMin,
      oeeLossPct,
      criticalCount,
    };
  }, [filteredEvents, fromDate, toDate]);

  const reasonPareto = useMemo(() => {
    const map = new Map();
    for (const e of filteredEvents) {
      const key = e.reason || "Unknown";
      map.set(key, (map.get(key) || 0) + (e.durationMin || 0));
    }
    const rows = Array.from(map.entries())
      .map(([reason, downMin]) => ({ reason, downMin }))
      .sort((a, b) => b.downMin - a.downMin)
      .slice(0, 8);

    const maxMin = rows.length ? rows[0].downMin : 0;
    return { rows, maxMin };
  }, [filteredEvents]);

  const machineBars = useMemo(() => {
    const map = new Map();
    for (const e of filteredEvents) {
      const key = `${e.machineId} • ${e.machineName}`;
      map.set(key, (map.get(key) || 0) + (e.durationMin || 0));
    }
    const rows = Array.from(map.entries())
      .map(([label, downMin]) => ({ label, downMin }))
      .sort((a, b) => b.downMin - a.downMin)
      .slice(0, 8);
    const maxMin = rows.length ? rows[0].downMin : 0;
    return { rows, maxMin };
  }, [filteredEvents]);

  const load = async () => {
    setLoading(true);
    try {
      const fromISO = `${fromDate}T00:00:00.000Z`;
      const toISO = `${toDate}T23:59:59.999Z`;

      const data = await mockFetch({ fromISO, toISO, plant, line, machineId });
      setEvents(data);

      toast({
        title: "Downtime updated",
        description: `Loaded ${data.length} downtime events for analysis.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load downtime",
        description: "Please try again. (API integration pending)",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset machine filter when it becomes invalid due to plant/line filters
  useEffect(() => {
    if (machineId === "all") return;
    const exists = machineOptions.some((m) => m.id === machineId);
    if (!exists) setMachineId("all");
  }, [machineOptions, machineId]);

  const exportCSV = () => {
    const headers = [
      "ID",
      "Plant",
      "Line",
      "Machine ID",
      "Machine Name",
      "Severity",
      "Reason",
      "Start",
      "End",
      "Duration (min)",
      "Ticket",
      "Owner",
      "Action",
    ];

    const rows = filteredEvents.map((e) => [
      e.id,
      e.plant,
      e.line,
      e.machineId,
      e.machineName,
      e.severity,
      e.reason,
      e.start,
      e.end,
      e.durationMin,
      e.ticket ?? "",
      e.owner ?? "",
      e.action ?? "",
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows
        .map((r) =>
          r
            .map((cell) => {
              const s = String(cell ?? "");
              const escaped = s.replace(/"/g, '""');
              return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
            })
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `downtime-analysis_${fromDate}_to_${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    toast({ title: "Export started", description: "Downtime CSV downloaded." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Downtime Analysis</h1>
          <p className="text-sm text-gray-600">
            PCB manufacturing downtime insights (Breakdowns + PM + production stops) with reason and machine ranking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            className="gap-2"
            disabled={loading || filteredEvents.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Button
            onClick={load}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            {loading ? "Refreshing..." : "Apply Filters"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label>Plant</Label>
            <Select value={plant} onValueChange={setPlant}>
              <SelectTrigger>
                <SelectValue placeholder="Select plant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                {MOCK_PLANTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Line / Process</Label>
            <Select value={line} onValueChange={setLine}>
              <SelectTrigger>
                <SelectValue placeholder="Select line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {MOCK_LINES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Machine</Label>
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
                {machineOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.id} — {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-12">
            <Label htmlFor="search">Search (ID, machine, reason, ticket)</Label>
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="eg: DRL-01, spindle, MT-1007..."
            />
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Total Downtime"
          value={fmtMins(metrics.totalDownMin)}
          sub={`${metrics.count} events`}
          icon={Clock}
        />
        <StatCard title="MTTR" value={fmtMins(metrics.mttrMin)} sub="Avg repair time / event" icon={Wrench} />
        <StatCard title="MTBF" value={fmtMins(metrics.mtbfMin)} sub="Approx between events" icon={Activity} />
        <StatCard
          title="OEE Loss (Downtime)"
          value={`${metrics.oeeLossPct}%`}
          sub={`${metrics.criticalCount} critical events`}
          icon={AlertTriangle}
        />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Top Downtime Reasons (Pareto)</h3>
              <p className="text-xs text-gray-500">Ranked by total downtime minutes</p>
            </div>
            <Badge variant="outline">Top {reasonPareto.rows.length}</Badge>
          </div>

          <div className="space-y-3">
            {reasonPareto.rows.length === 0 ? (
              <p className="text-sm text-gray-500">No downtime data for selected filters.</p>
            ) : (
              reasonPareto.rows.map((r) => (
                <MiniBar
                  key={r.reason}
                  label={r.reason}
                  valueMin={r.downMin}
                  maxMin={reasonPareto.maxMin}
                />
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Most Affected Machines</h3>
              <p className="text-xs text-gray-500">Ranked by total downtime minutes</p>
            </div>
            <Badge variant="outline">Top {machineBars.rows.length}</Badge>
          </div>

          <div className="space-y-3">
            {machineBars.rows.length === 0 ? (
              <p className="text-sm text-gray-500">No downtime data for selected filters.</p>
            ) : (
              machineBars.rows.map((r) => (
                <MiniBar key={r.label} label={r.label} valueMin={r.downMin} maxMin={machineBars.maxMin} />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Event Table */}
      <Card className="p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Downtime Events</h3>
            <p className="text-xs text-gray-500">
              Drill / plating / etching / AOI / E-test / routing stoppages and maintenance tickets.
            </p>
          </div>
          <Badge className="w-fit" variant="secondary">
            Showing {filteredEvents.length} events
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold text-gray-600">ID</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Plant</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Line</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Machine</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Severity</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Reason</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Start</th>
                <th className="px-3 py-2 font-semibold text-gray-600">End</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Duration</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Ticket</th>
              </tr>
            </thead>

            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-gray-500" colSpan={10}>
                    No downtime events found. Try widening the date range or clearing filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 50).map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50/60">
                    <td className="px-3 py-2 font-medium text-gray-900">{e.id}</td>
                    <td className="px-3 py-2 text-gray-700">{e.plant}</td>
                    <td className="px-3 py-2 text-gray-700">{e.line}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-gray-900">{e.machineId}</span>
                        <span className="text-xs text-gray-500">{e.machineName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <SeverityBadge value={e.severity} />
                    </td>
                    <td className="px-3 py-2 text-gray-700">{e.reason}</td>
                    <td className="px-3 py-2 text-gray-700">{fmtDateTime(e.start)}</td>
                    <td className="px-3 py-2 text-gray-700">{fmtDateTime(e.end)}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{fmtMins(e.durationMin)}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {e.ticket ? <Badge variant="outline">{e.ticket}</Badge> : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredEvents.length > 50 ? (
            <p className="mt-3 text-xs text-gray-500">
              Showing first 50 rows for performance. Use filters/search to narrow results.
            </p>
          ) : null}
        </div>
      </Card>

      {/* Footer hint */}
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">Best practice (PCB factory)</p>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Classify reasons into standardized codes (Electrical, Mechanical, Utilities, Chemical, Setup).</li>
              <li>Track “micro-stops” separately from breakdowns to improve true OEE visibility.</li>
              <li>Link downtime events to spare consumption and PM tasks to reduce repeat failures.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
