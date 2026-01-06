// src/pages/maintenance/preventive/PMCalendar.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Settings2,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * PMCalendar.jsx (PCBxpress - PCB Manufacturing ERP)
 * Path: src/pages/maintenance/preventive/PMCalendar.jsx
 *
 * Purpose:
 * - Monthly preventive maintenance schedule view (calendar)
 * - Quickly see due/overdue/completed PMs
 * - Filter by equipment/line/technician/status
 *
 * API integration points (replace mocks):
 * - pmService.list({ month, year, q, status, technicianId, equipmentId, line })
 * - pmService.markDone(pmId, payload)
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const STATUS = [
  { key: "all", label: "All" },
  { key: "due", label: "Due" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

const STATUS_PILL = {
  due: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const PRIORITY_PILL = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function monthLabel(year, monthIndex) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function startOfMonth(year, monthIndex) {
  return new Date(year, monthIndex, 1);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function dayOfWeekIndex(date) {
  // 0=Sun ... 6=Sat
  return date.getDay();
}

function isSameDay(aISO, bISO) {
  return aISO === bISO;
}

function todayISO() {
  const t = new Date();
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
}

function StatusIcon({ status }) {
  const base = "h-4 w-4";
  if (status === "completed") return <CheckCircle2 className={base} />;
  if (status === "overdue") return <AlertTriangle className={base} />;
  if (status === "due") return <Clock className={base} />;
  return <Wrench className={base} />;
}

function DayCell({ dateISO, inMonth, isToday, items, onSelectDay }) {
  const count = items.length;
  const hasOverdue = items.some((x) => x.status === "overdue");
  const hasDue = items.some((x) => x.status === "due");
  const hasCompleted = items.some((x) => x.status === "completed");

  return (
    <button
      type="button"
      onClick={() => onSelectDay(dateISO)}
      className={cx(
        "group relative flex h-28 flex-col rounded-2xl border p-3 text-left transition",
        "bg-white hover:bg-gray-50",
        inMonth ? "opacity-100" : "opacity-50",
        isToday ? "ring-2 ring-[#dc2551]/30" : "ring-0"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold text-gray-700">{dateISO.split("-")[2]}</div>
        {count > 0 && (
          <div className="flex items-center gap-1">
            {hasOverdue && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
            {hasDue && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
            {hasCompleted && <span className="h-2.5 w-2.5 rounded-full bg-green-500" />}
          </div>
        )}
      </div>

      {count === 0 ? (
        <div className="mt-auto text-[11px] text-gray-400">No PM</div>
      ) : (
        <div className="mt-2 space-y-1">
          {items.slice(0, 3).map((it) => (
            <div
              key={it.id}
              className={cx(
                "flex items-center gap-2 rounded-xl border px-2 py-1 text-[11px]",
                it.status === "overdue"
                  ? "border-red-200 bg-red-50"
                  : it.status === "due"
                  ? "border-blue-200 bg-blue-50"
                  : "border-green-200 bg-green-50"
              )}
              title={`${it.equipment_name} • ${it.checklist}`}
            >
              <StatusIcon status={it.status} />
              <span className="truncate font-semibold text-gray-800">{it.equipment_name}</span>
            </div>
          ))}
          {count > 3 && <div className="text-[11px] text-gray-500">+{count - 3} more</div>}
        </div>
      )}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{ boxShadow: "0 0 0 2px rgba(220,37,81,.08) inset" }}
      />
    </button>
  );
}

function Drawer({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
            {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export default function PMCalendar() {
  const { toast } = useToast();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth()); // 0-11

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [line, setLine] = useState("all");
  const [tech, setTech] = useState("all");

  const [selectedDay, setSelectedDay] = useState(todayISO());
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mock options (replace with masters)
  const lines = ["all", "Line A", "Line B", "Line C"];
  const technicians = ["all", "Arun", "Nisha", "Faisal", "Rakesh"];

  // Mock PM schedule (replace with API)
  const allPMs = useMemo(() => {
    // generate a few records around current month
    const make = (id, day, h, m, statusV, priority, eq, checklist, by, durationMin) => ({
      id,
      date: toISODate(year, monthIndex, day),
      time: `${pad2(h)}:${pad2(m)}`,
      status: statusV, // due | overdue | completed
      priority,
      line: eq.includes("AOI") ? "Line B" : eq.includes("CNC") ? "Line A" : "Line C",
      equipment_name: eq,
      checklist,
      assigned_to: by,
      est_minutes: durationMin,
      last_done: statusV === "completed" ? toISODate(year, monthIndex, Math.max(1, day - 28)) : null,
    });

    return [
      make("PM-1001", 2, 10, 0, "completed", "medium", "CNC Drill 01", "PM-CNC-DRL-MONTHLY", "Arun", 60),
      make("PM-1002", 4, 14, 30, "due", "high", "AOI Line 02", "PM-AOI-WEEKLY", "Nisha", 45),
      make("PM-1003", 6, 9, 0, "overdue", "critical", "UV Exposure Unit", "PM-UV-DAILY", "Arun", 25),
      make("PM-1004", 10, 11, 15, "due", "low", "Compressor 03", "PM-COMP-MONTHLY", "Faisal", 40),
      make("PM-1005", 12, 15, 0, "completed", "medium", "Etch Line Pump", "PM-ETCH-PUMP-MONTHLY", "Rakesh", 35),
      make("PM-1006", 16, 10, 30, "due", "high", "Plating Rectifier", "PM-PLATE-RECT-WEEKLY", "Arun", 50),
      make("PM-1007", 18, 13, 0, "overdue", "high", "CNC Router 02", "PM-CNC-RTR-MONTHLY", "Arun", 70),
      make("PM-1008", 22, 10, 0, "due", "medium", "Solder Mask Oven", "PM-OVEN-MONTHLY", "Nisha", 55),
      make("PM-1009", 26, 9, 30, "completed", "low", "DI Water Plant", "PM-DI-WEEKLY", "Faisal", 30),
      make("PM-1010", 28, 16, 0, "due", "medium", "E-Test Fixture", "PM-ETEST-WEEKLY", "Nisha", 40),
    ];
  }, [year, monthIndex]);

  const filteredPMs = useMemo(() => {
    const qLower = q.trim().toLowerCase();

    return allPMs.filter((pm) => {
      if (status !== "all" && pm.status !== status) return false;
      if (line !== "all" && pm.line !== line) return false;
      if (tech !== "all" && pm.assigned_to !== tech) return false;

      if (qLower) {
        const hay = `${pm.equipment_name} ${pm.checklist} ${pm.id} ${pm.assigned_to}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }

      return true;
    });
  }, [allPMs, q, status, line, tech]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const pm of filteredPMs) {
      const key = pm.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(pm);
    }
    // sort items in each day by time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      map.set(k, arr);
    }
    return map;
  }, [filteredPMs]);

  const calendarCells = useMemo(() => {
    const first = startOfMonth(year, monthIndex);
    const firstDow = dayOfWeekIndex(first); // 0..6
    const dim = daysInMonth(year, monthIndex);

    // We render a 6-week grid (42 cells)
    const cells = [];
    const startDate = new Date(year, monthIndex, 1 - firstDow);

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const inMonth = d.getMonth() === monthIndex;
      const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const items = byDay.get(iso) || [];
      const isToday = iso === todayISO();

      cells.push({ iso, inMonth, isToday, items });
    }
    return cells;
  }, [year, monthIndex, byDay]);

  const stats = useMemo(() => {
    const due = filteredPMs.filter((x) => x.status === "due").length;
    const overdue = filteredPMs.filter((x) => x.status === "overdue").length;
    const completed = filteredPMs.filter((x) => x.status === "completed").length;
    return { due, overdue, completed, total: filteredPMs.length };
  }, [filteredPMs]);

  const dayItems = useMemo(() => byDay.get(selectedDay) || [], [byDay, selectedDay]);

  const prevMonth = () => {
    const d = new Date(year, monthIndex - 1, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  };

  const nextMonth = () => {
    const d = new Date(year, monthIndex + 1, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  };

  const openDay = (iso) => {
    setSelectedDay(iso);
    setDrawerOpen(true);
  };

  const markCompleted = async (pmId) => {
    // Replace with API call pmService.markDone(pmId)
    toast({ title: "Marked completed", description: `PM ${pmId} marked as completed (demo).` });
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonthIndex(t.getMonth());
    const iso = todayISO();
    setSelectedDay(iso);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dc2551]/10">
            <CalendarDays className="h-5 w-5 text-[#dc2551]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PM Calendar</h1>
            <p className="text-sm text-gray-500">
              Preventive maintenance scheduling for PCB manufacturing equipment (due, overdue, completed).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={goToday}>
            <CalendarDays className="h-4 w-4" />
            Today
          </Button>
          <Link to="/maintenance/preventive/create">
            <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]">
              <Plus className="h-4 w-4" />
              Schedule PM
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <CardDescription>Filter PM tasks by equipment, line, technician and status.</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search equipment / checklist / PM ID..."
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Settings2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Wrench className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={line}
                onChange={(e) => setLine(e.target.value)}
              >
                {lines.map((l) => (
                  <option key={l} value={l}>
                    {l === "all" ? "All Lines" : l}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={tech}
                onChange={(e) => setTech(e.target.value)}
              >
                {technicians.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Technicians" : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
              <span className={cx("rounded-full px-3 py-1.5 text-xs font-semibold", "bg-gray-100 text-gray-700")}>
                Total: {stats.total}
              </span>
              <span className={cx("rounded-full px-3 py-1.5 text-xs font-semibold", STATUS_PILL.due)}>
                Due: {stats.due}
              </span>
              <span className={cx("rounded-full px-3 py-1.5 text-xs font-semibold", STATUS_PILL.overdue)}>
                Overdue: {stats.overdue}
              </span>
              <span className={cx("rounded-full px-3 py-1.5 text-xs font-semibold", STATUS_PILL.completed)}>
                Completed: {stats.completed}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{monthLabel(year, monthIndex)}</CardTitle>
                <CardDescription>Click a day to view scheduled PM tasks.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={prevMonth} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth} className="gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="px-2 pb-1 text-xs font-semibold text-gray-500">
                  {d}
                </div>
              ))}

              {calendarCells.map((c) => (
                <DayCell
                  key={c.iso}
                  dateISO={c.iso}
                  inMonth={c.inMonth}
                  isToday={c.isToday}
                  items={c.items}
                  onSelectDay={openDay}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Day drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`PM Tasks • ${selectedDay}`}
        subtitle={`${dayItems.length} item(s)`}
      >
        {dayItems.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50">
              <Wrench className="h-5 w-5 text-gray-500" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">No PM scheduled</p>
            <p className="mt-1 text-sm text-gray-500">Schedule a PM task for this day.</p>
            <div className="mt-4 flex justify-center">
              <Link to="/maintenance/preventive/create">
                <Button className="bg-[#dc2551] hover:bg-[#b02045]">Schedule PM</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {dayItems.map((pm) => (
              <Card key={pm.id} className="overflow-hidden">
                <CardHeader className="border-b bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold truncate">{pm.equipment_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {pm.id} • {pm.checklist} • {pm.line}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_PILL[pm.status])}>
                        <span className="inline-flex items-center gap-1">
                          <StatusIcon status={pm.status} />
                          {pm.status.toUpperCase()}
                        </span>
                      </span>
                      <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", PRIORITY_PILL[pm.priority])}>
                        {pm.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Scheduled</p>
                      <p className="mt-0.5 text-sm text-gray-800">
                        {pm.date} • {pm.time}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Assigned To</p>
                      <p className="mt-0.5 text-sm text-gray-800">{pm.assigned_to}</p>
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Est. Duration</p>
                      <p className="mt-0.5 text-sm text-gray-800">{pm.est_minutes} min</p>
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Last Done</p>
                      <p className="mt-0.5 text-sm text-gray-800">{pm.last_done || "-"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/maintenance/equipment`}>
                      <Button variant="outline" size="sm">Equipment</Button>
                    </Link>

                    {pm.status !== "completed" && (
                      <Button
                        size="sm"
                        className="bg-[#dc2551] hover:bg-[#b02045]"
                        onClick={() => markCompleted(pm.id)}
                      >
                        Mark Completed
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Open checklist (demo)",
                          description: "Connect checklist templates and execution screen here.",
                        })
                      }
                    >
                      Open Checklist
                    </Button>

                    <div className="ml-auto">
                      <Badge variant="outline">PCB Maintenance</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
