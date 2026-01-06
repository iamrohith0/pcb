// src/pages/settings/company/WorkingHours.jsx
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Clock, Loader2, RefreshCw, Save } from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_SHIFT = {
  start: "09:00",
  end: "18:00",
  break_minutes: 60,
  enabled: true,
};

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// returns minutes from "HH:MM"
function timeToMinutes(t) {
  if (!t || typeof t !== "string") return 0;
  const [hh, mm] = t.split(":").map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  return hh * 60 + mm;
}

function minutesToHM(m) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function calcNetMinutes(start, end, breakMin, enabled) {
  if (!enabled) return 0;
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  let diff = e - s;
  // allow overnight shift (e.g., 22:00 -> 06:00)
  if (diff < 0) diff = 24 * 60 + diff;
  diff = Math.max(0, diff - clamp(toInt(breakMin, 0), 0, 600));
  return diff;
}

export default function WorkingHours() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [weekly, setWeekly] = useState(() => {
    const w = {};
    for (const d of DAYS) w[d.key] = { ...DEFAULT_SHIFT, enabled: d.key !== "sun" };
    return w;
  });

  const totalWeeklyMinutes = useMemo(() => {
    return DAYS.reduce((sum, d) => {
      const s = weekly[d.key];
      return sum + calcNetMinutes(s.start, s.end, s.break_minutes, s.enabled);
    }, 0);
  }, [weekly]);

  const totalWeeklyHours = useMemo(() => (totalWeeklyMinutes / 60).toFixed(2), [totalWeeklyMinutes]);

  const fetchWorkingHours = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /settings/working-hours
      // -> { data: { timezone, weekly: { mon:{start,end,break_minutes,enabled}, ... } } }
      const res = await api.get("/settings/working-hours");
      const data = res?.data?.data ?? res?.data ?? {};

      if (typeof data.timezone === "string" && data.timezone.trim()) setTimezone(data.timezone.trim());

      if (data.weekly && typeof data.weekly === "object") {
        const next = {};
        for (const d of DAYS) {
          const src = data.weekly?.[d.key] ?? {};
          next[d.key] = {
            start: typeof src.start === "string" ? src.start : weekly[d.key].start,
            end: typeof src.end === "string" ? src.end : weekly[d.key].end,
            break_minutes: clamp(toInt(src.break_minutes, weekly[d.key].break_minutes), 0, 600),
            enabled: typeof src.enabled === "boolean" ? src.enabled : weekly[d.key].enabled,
          };
        }
        setWeekly(next);
      }
    } catch (err) {
      console.warn("Working hours fetch failed:", err);
      toast({
        title: "Failed to load working hours",
        description: err?.response?.data?.message || "Using default schedule for now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkingHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDay = (dayKey, patch) => {
    setWeekly((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], ...patch },
    }));
  };

  const applyToAllEnabledDays = (fromDayKey) => {
    const src = weekly[fromDayKey];
    setWeekly((prev) => {
      const next = { ...prev };
      for (const d of DAYS) {
        if (next[d.key].enabled) {
          next[d.key] = { ...next[d.key], start: src.start, end: src.end, break_minutes: src.break_minutes };
        }
      }
      return next;
    });
    toast({ title: "Applied to enabled days", description: "Shift timing copied across enabled days." });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        timezone: timezone.trim() || "Asia/Kolkata",
        weekly: weekly,
      };

      // Expected:
      // PUT /settings/working-hours
      await api.put("/settings/working-hours", payload);

      toast({ title: "Working hours saved", description: "Schedule updated successfully." });
    } catch (err) {
      console.warn("Working hours save failed:", err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading working hours...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Working Hours</h1>
            <p className="text-sm text-gray-500">
              Configure plant working schedule used for capacity planning, SLA/lead time, and attendance rules.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
            Weekly total: {totalWeeklyHours} hrs
          </Badge>

          <Button variant="outline" className="gap-2" onClick={fetchWorkingHours} disabled={saving}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Timezone */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Timezone</p>
            <p className="text-xs text-gray-500">Displayed across schedules and reports.</p>
          </div>
          <div className="w-full max-w-xs">
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Kolkata" />
          </div>
        </div>
      </Card>

      {/* Weekly grid */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Weekly Schedule</p>
            <p className="text-xs text-gray-500">Enable/disable days and set shift timings + break.</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-12 gap-3 border-b pb-2 text-xs font-semibold text-gray-500">
              <div className="col-span-3 pl-1">Day</div>
              <div className="col-span-2 text-center">Enabled</div>
              <div className="col-span-2">Start</div>
              <div className="col-span-2">End</div>
              <div className="col-span-2">Break (min)</div>
              <div className="col-span-1 text-right pr-1">Net</div>
            </div>

            <div className="mt-2 space-y-2">
              {DAYS.map((d) => {
                const s = weekly[d.key];
                const netMins = calcNetMinutes(s.start, s.end, s.break_minutes, s.enabled);
                const netHM = netMins ? minutesToHM(netMins) : "00:00";

                return (
                  <div
                    key={d.key}
                    className={cx(
                      "grid grid-cols-12 gap-3 rounded-xl border px-3 py-2",
                      s.enabled ? "bg-white" : "bg-gray-50 opacity-85"
                    )}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{d.label}</span>
                      {d.key === "sat" || d.key === "sun" ? (
                        <Badge variant="outline" className="border-gray-200 bg-white text-gray-600">
                          Weekend
                        </Badge>
                      ) : null}
                    </div>

                    <div className="col-span-2 flex items-center justify-center">
                      <Switch checked={!!s.enabled} onCheckedChange={(v) => setDay(d.key, { enabled: v })} />
                    </div>

                    <div className="col-span-2">
                      <Label className="sr-only">Start</Label>
                      <Input
                        type="time"
                        value={s.start}
                        disabled={!s.enabled}
                        onChange={(e) => setDay(d.key, { start: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="sr-only">End</Label>
                      <Input
                        type="time"
                        value={s.end}
                        disabled={!s.enabled}
                        onChange={(e) => setDay(d.key, { end: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="sr-only">Break minutes</Label>
                      <Input
                        type="number"
                        min={0}
                        max={600}
                        value={s.break_minutes}
                        disabled={!s.enabled}
                        onChange={(e) => setDay(d.key, { break_minutes: clamp(toInt(e.target.value, 0), 0, 600) })}
                        placeholder="60"
                      />
                      <button
                        type="button"
                        className={cx(
                          "mt-1 text-[11px] font-semibold",
                          s.enabled ? "text-[#dc2551] hover:underline" : "text-gray-400 cursor-not-allowed"
                        )}
                        disabled={!s.enabled}
                        onClick={() => applyToAllEnabledDays(d.key)}
                      >
                        Apply to enabled days
                      </button>
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
                        {netHM}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">How this helps PCB ERP</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                <li>Capacity planning: shift hours drive machine & line capacity.</li>
                <li>Scheduling: lead times and promised dates use enabled working days.</li>
                <li>Attendance rules: working days vs holidays/weekends calculations.</li>
                <li>Reports: weekly hours benchmark for utilization and OEE.</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
