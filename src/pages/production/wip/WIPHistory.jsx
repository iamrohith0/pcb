// src/pages/production/wip/WIPHistory.jsx
import { motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock,
    Download,
    Factory,
    History,
    Layers,
    RefreshCw,
    Search,
    Timer,
    Wrench
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

/**
 * PCBxpress – WIP History (UI scaffold)
 * Purpose:
 * - Track stage transitions for a Work Order / Lot / Panel (timeline)
 * - Filters: plant, date range, stage, event type, search
 * - Export: CSV/Excel hook
 *
 * Hook to backend later:
 * - GET /production/wip/history?plant=...&from=YYYY-MM-DD&to=YYYY-MM-DD&q=...
 * - GET /production/wip/history/:workOrderNo
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const PLANTS = ["Main Plant", "Plant-2", "Proto Lab"];

const STAGES = [
  { key: "cam", label: "CAM Prep", icon: Layers },
  { key: "imaging", label: "Imaging", icon: Layers },
  { key: "etching", label: "Etching", icon: Factory },
  { key: "drilling", label: "Drilling", icon: Wrench },
  { key: "plating", label: "Plating", icon: Layers },
  { key: "soldermask", label: "Solder Mask", icon: Layers },
  { key: "aoi", label: "AOI", icon: Activity },
  { key: "etest", label: "E-Test", icon: Activity },
  { key: "final", label: "Final QC", icon: CheckCircle2 },
];

const EVENT_TYPES = ["Move", "Start", "Finish", "Hold", "Release", "Rework", "Scrap"];

function stageMeta(stageKey) {
  return STAGES.find((s) => s.key === stageKey) ?? { key: stageKey, label: stageKey, icon: History };
}

function eventBadge(type) {
  if (type === "Hold")
    return (
      <Badge className="bg-amber-600 hover:bg-amber-600">
        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
        Hold
      </Badge>
    );
  if (type === "Release") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Release</Badge>;
  if (type === "Rework") return <Badge className="bg-purple-600 hover:bg-purple-600">Rework</Badge>;
  if (type === "Scrap") return <Badge className="bg-red-600 hover:bg-red-600">Scrap</Badge>;
  if (type === "Start") return <Badge className="bg-blue-600 hover:bg-blue-600">Start</Badge>;
  if (type === "Finish") return <Badge className="bg-green-600 hover:bg-green-600">Finish</Badge>;
  return <Badge variant="secondary">Move</Badge>;
}

function fmtDateTime(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function diffMinutes(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

function durationPill(mins) {
  if (!mins && mins !== 0) return <span className="text-xs text-gray-500">—</span>;

  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const cls =
    mins >= 24 * 60
      ? "bg-red-50 text-red-700"
      : mins >= 8 * 60
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";

  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", cls)}>
      <Timer className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function TimelineItem({ item, isSelected, onSelect }) {
  const meta = stageMeta(item.stage);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.workOrderNo)}
      className={cx(
        "w-full text-left rounded-2xl border p-3 transition",
        isSelected ? "border-[#dc2551] bg-[#dc2551]/5" : "bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cx("grid h-8 w-8 place-items-center rounded-xl", isSelected ? "bg-[#dc2551] text-white" : "bg-gray-100 text-gray-700")}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{item.workOrderNo}</p>
              <p className="truncate text-xs text-gray-500">
                {item.customer} • {item.partNo}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{item.plant}</Badge>
            <Badge variant="secondary">{item.layers}L</Badge>
            <Badge variant="secondary">Qty {item.qty}</Badge>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Last event</p>
          <p className="text-xs font-semibold text-gray-900">{fmtDateTime(item.lastEventAt)}</p>
          <div className="mt-2 flex justify-end">{eventBadge(item.lastEventType)}</div>
        </div>
      </div>
    </button>
  );
}

function EventRow({ e, prev }) {
  const stage = stageMeta(e.stage);
  const Icon = stage.icon;
  const mins = prev ? diffMinutes(prev.timestamp, e.timestamp) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative pl-9"
    >
      {/* line */}
      <span className="absolute left-4 top-0 h-full w-px bg-gray-200" aria-hidden="true" />
      {/* dot */}
      <span
        className={cx(
          "absolute left-[11px] top-2 grid h-6 w-6 place-items-center rounded-full border",
          e.type === "Hold" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-gray-200 text-gray-600"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="rounded-2xl border bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {e.stageLabel} • <span className="text-gray-600">{e.type}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {fmtDateTime(e.timestamp)}
              </span>
              {e.by ? <span className="ml-2">• By {e.by}</span> : null}
              {e.machine ? <span className="ml-2">• Machine {e.machine}</span> : null}
            </p>

            {e.note ? (
              <div className="mt-2 rounded-xl bg-gray-50 p-2 text-xs text-gray-700">
                <span className="font-semibold text-gray-800">Note: </span>
                {e.note}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {eventBadge(e.type)}
            {durationPill(mins)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function WIPHistory() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // Filters
  const [plant, setPlant] = useState("Main Plant");
  const [from, setFrom] = useState("2025-12-25");
  const [to, setTo] = useState("2026-01-05");
  const [stage, setStage] = useState("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");

  // Selected Work Order (drives right pane)
  const [selectedWO, setSelectedWO] = useState("WO-24033");

  // Demo “index” list
  const [index, setIndex] = useState(() => [
    {
      workOrderNo: "WO-24033",
      customer: "Helio Tech",
      partNo: "HEL-IO-LOGIC",
      plant: "Main Plant",
      qty: 60,
      layers: 8,
      lastEventAt: "2026-01-04T18:20:00",
      lastEventType: "Hold",
    },
    {
      workOrderNo: "WO-24041",
      customer: "ByteWave",
      partNo: "BW-SENSOR-FLEX",
      plant: "Main Plant",
      qty: 40,
      layers: 2,
      lastEventAt: "2026-01-03T11:10:00",
      lastEventType: "Hold",
    },
    {
      workOrderNo: "WO-24019",
      customer: "Aster Robotics",
      partNo: "AST-RB-CTRL-02",
      plant: "Main Plant",
      qty: 120,
      layers: 4,
      lastEventAt: "2026-01-05T10:30:00",
      lastEventType: "Move",
    },
    {
      workOrderNo: "WO-24046",
      customer: "Raven Systems",
      partNo: "RVN-MCU-BASE",
      plant: "Main Plant",
      qty: 110,
      layers: 2,
      lastEventAt: "2026-01-05T09:05:00",
      lastEventType: "Start",
    },
  ]);

  // Demo events by WO
  const [eventsByWO] = useState(() => {
    const mk = (wo, stageKey, type, ts, extra = {}) => {
      const meta = stageMeta(stageKey);
      return {
        id: `${wo}-${stageKey}-${type}-${ts}`,
        workOrderNo: wo,
        stage: stageKey,
        stageLabel: meta.label,
        type,
        timestamp: ts,
        ...extra,
      };
    };

    return {
      "WO-24033": [
        mk("WO-24033", "cam", "Finish", "2026-01-01T09:15:00", { by: "CAM Lead" }),
        mk("WO-24033", "imaging", "Start", "2026-01-01T13:20:00", { machine: "IMG-02", by: "Operator A" }),
        mk("WO-24033", "imaging", "Finish", "2026-01-01T18:00:00", { machine: "IMG-02" }),
        mk("WO-24033", "etching", "Start", "2026-01-02T08:30:00", { machine: "ETCH-01" }),
        mk("WO-24033", "etching", "Finish", "2026-01-02T12:10:00", { machine: "ETCH-01" }),
        mk("WO-24033", "drilling", "Start", "2026-01-02T15:05:00", { machine: "DRL-03" }),
        mk("WO-24033", "drilling", "Finish", "2026-01-02T19:40:00", { machine: "DRL-03" }),
        mk("WO-24033", "plating", "Start", "2026-01-03T10:15:00", { by: "Shift B", machine: "PLT-01" }),
        mk("WO-24033", "plating", "Hold", "2026-01-04T18:20:00", {
          by: "QC",
          note: "Copper thickness variation – re-check bath parameters",
        }),
      ],
      "WO-24041": [
        mk("WO-24041", "cam", "Hold", "2026-01-03T11:10:00", {
          by: "Sales",
          note: "Missing drill file in customer package; request updated data.",
        }),
      ],
      "WO-24019": [
        mk("WO-24019", "cam", "Finish", "2026-01-04T09:00:00", { by: "CAM Lead" }),
        mk("WO-24019", "imaging", "Start", "2026-01-04T12:20:00", { machine: "IMG-01" }),
        mk("WO-24019", "imaging", "Move", "2026-01-05T10:30:00", { note: "Moved to Etching queue" }),
      ],
      "WO-24046": [
        mk("WO-24046", "soldermask", "Finish", "2026-01-05T07:10:00", { machine: "SM-02" }),
        mk("WO-24046", "aoi", "Finish", "2026-01-05T08:40:00", { machine: "AOI-01" }),
        mk("WO-24046", "etest", "Start", "2026-01-05T09:05:00", { machine: "ET-02", by: "Operator C" }),
      ],
    };
  });

  const refresh = async () => {
    setLoading(true);
    try {
      // Hook API here
      await new Promise((r) => setTimeout(r, 500));
      toast({ title: "History refreshed", description: "Latest movement events loaded." });
    } catch (e) {
      toast({ title: "Refresh failed", description: "Could not load WIP history.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredIndex = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return index
      .filter((x) => x.plant === plant)
      .filter((x) => {
        if (!qq) return true;
        return (
          x.workOrderNo.toLowerCase().includes(qq) ||
          x.customer.toLowerCase().includes(qq) ||
          x.partNo.toLowerCase().includes(qq)
        );
      });
  }, [index, plant, q]);

  const selectedEventsRaw = useMemo(() => {
    const ev = eventsByWO[selectedWO] ?? [];
    return [...ev].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [eventsByWO, selectedWO]);

  const selectedEventsFiltered = useMemo(() => {
    const f = new Date(from).getTime();
    const t = new Date(to + "T23:59:59").getTime();

    return selectedEventsRaw
      .filter((e) => {
        const ts = new Date(e.timestamp).getTime();
        return ts >= f && ts <= t;
      })
      .filter((e) => (stage === "all" ? true : e.stage === stage))
      .filter((e) => (type === "all" ? true : e.type === type));
  }, [selectedEventsRaw, from, to, stage, type]);

  const lead = useMemo(() => {
    if (selectedEventsRaw.length < 2) return null;
    const mins = diffMinutes(selectedEventsRaw[0].timestamp, selectedEventsRaw[selectedEventsRaw.length - 1].timestamp);
    return mins;
  }, [selectedEventsRaw]);

  const holdsCount = useMemo(() => selectedEventsRaw.filter((e) => e.type === "Hold").length, [selectedEventsRaw]);

  const headerMeta = useMemo(() => {
    const row = index.find((x) => x.workOrderNo === selectedWO);
    return row ?? null;
  }, [index, selectedWO]);

  useEffect(() => {
    // Ensure selected WO exists within current plant; otherwise pick first available
    const exists = filteredIndex.some((x) => x.workOrderNo === selectedWO);
    if (!exists && filteredIndex.length) setSelectedWO(filteredIndex[0].workOrderNo);
    if (!filteredIndex.length) setSelectedWO("");
  }, [plant, filteredIndex, selectedWO]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Production</p>
            <h1 className="text-xl font-bold text-gray-900">WIP History</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track stage movement events for work orders (holds, rework, start/finish timestamps and dwell time).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => toast({ title: "Export", description: "Hook to API: export history CSV/Excel." })}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            onClick={refresh}
            className="bg-cyan-600 hover:bg-cyan-500 gap-2"
            disabled={loading}
          >
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter history by plant, date range, stage, event type and search.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <Label className="text-xs text-gray-500">Plant</Label>
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                {PLANTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-500">From</Label>
              <div className="relative mt-1">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input value={from} onChange={(e) => setFrom(e.target.value)} type="date" className="pl-9" />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-500">To</Label>
              <div className="relative mt-1">
                <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input value={to} onChange={(e) => setTo(e.target.value)} type="date" className="pl-9" />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-500">Search</Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="WO / Customer / Part"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-6">
              <Label className="text-xs text-gray-500">Stage</Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="all">All stages</option>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <Label className="text-xs text-gray-500">Event Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option value="all">All event types</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: WO list */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work Orders</CardTitle>
            <CardDescription>Select a WO to view movement timeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredIndex.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-700">No work orders</p>
                <p className="mt-1 text-xs text-gray-500">Change plant or search text.</p>
              </div>
            ) : (
              filteredIndex.map((it) => (
                <TimelineItem
                  key={it.workOrderNo}
                  item={it}
                  isSelected={it.workOrderNo === selectedWO}
                  onSelect={setSelectedWO}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Timeline */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Timeline</CardTitle>
                <CardDescription>
                  {headerMeta ? (
                    <>
                      <span className="font-semibold text-gray-800">{headerMeta.workOrderNo}</span> •{" "}
                      {headerMeta.customer} • {headerMeta.partNo}
                    </>
                  ) : (
                    "Select a work order to view its movement history."
                  )}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {headerMeta ? (
                  <>
                    <Badge variant="secondary">{headerMeta.plant}</Badge>
                    <Badge variant="secondary">{headerMeta.layers}L</Badge>
                    <Badge variant="secondary">Qty {headerMeta.qty}</Badge>
                    <Badge className={cx("bg-gray-900 hover:bg-gray-900")}>
                      <History className="mr-1 h-3.5 w-3.5" />
                      {selectedEventsRaw.length} events
                    </Badge>
                  </>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Summary pills */}
            {headerMeta ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lead time</p>
                  <div className="mt-2">{durationPill(lead)}</div>
                  <p className="mt-1 text-xs text-gray-500">From first → last event</p>
                </div>
                <div className="rounded-2xl border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Holds</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{holdsCount}</p>
                  <p className="mt-1 text-xs text-gray-500">Total hold events</p>
                </div>
                <div className="rounded-2xl border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected range</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {from} → {to}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Filters apply only to timeline view</p>
                </div>
              </div>
            ) : null}

            {/* Timeline list */}
            {!selectedWO ? (
              <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-700">No selection</p>
                <p className="mt-1 text-xs text-gray-500">Choose a Work Order from the left list.</p>
              </div>
            ) : selectedEventsFiltered.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-700">No events in this range</p>
                <p className="mt-1 text-xs text-gray-500">Adjust date range, stage or event type filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEventsFiltered.map((e, idx) => {
                  const prev = idx === 0 ? null : selectedEventsFiltered[idx - 1];
                  return <EventRow key={e.id} e={e} prev={prev} />;
                })}
              </div>
            )}

            {/* Footer note */}
            <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">Implementation notes</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Stage dwell time shown is computed from previous event to current event (demo logic).</li>
                <li>Later: support Lot/Panel IDs and link to NCR/CAPA entries for Hold/Rework events.</li>
                <li>Later: add “operator shift”, “machine”, and “process parameters” capture per event.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
