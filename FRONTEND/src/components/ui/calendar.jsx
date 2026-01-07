// src/components/ui/calendar.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function Calendar({
  mode = "single",          // only "single" is implemented
  selected,                 // Date | undefined
  onSelect,                 // (Date | undefined) => void
  initialFocus = false,     // if true, focus the grid when mounted
  isDateDisabled,           // optional function to disable specific dates
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => selected ?? today); // month in view
  const gridRef = useRef(null);

  useEffect(() => {
    if (!selected) return;
    // keep the calendar on the month of the selected date
    setCursor(selected);
  }, [selected]);

  useEffect(() => {
    if (initialFocus && gridRef.current) {
      gridRef.current.focus();
    }
  }, [initialFocus]);

  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const startWeekday = start.getDay(); // 0..6 (Sun..Sat)

    const out = [];
    // blanks for previous month
    for (let i = 0; i < startWeekday; i++) out.push(null);

    for (let d = 1; d <= end.getDate(); d++) {
      out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    // Pad to complete weeks (optional)
    const rem = out.length % 7;
    if (rem) {
      for (let i = 0; i < 7 - rem; i++) out.push(null);
    }
    return out;
  }, [cursor]);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const onDayClick = (d) => {
    if (!d) return;
    if (isDateDisabled?.(d)) return;
    onSelect?.(d);
  };

  const gotoPrev = () => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  };
  const gotoNext = () => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  };

  return (
    <div className="w-[280px] select-none rounded-md border bg-white p-2 text-sm">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={gotoPrev}
          className="rounded-md p-1 hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-medium">{monthLabel}</div>
        <button
          type="button"
          onClick={gotoNext}
          className="rounded-md p-1 hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[11px] text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {/* Days grid */}
      <div
        ref={gridRef}
        tabIndex={-1}
        className="grid grid-cols-7 gap-1 px-1 pb-1"
        role="grid"
        aria-label="Calendar"
      >
        {days.map((d, idx) => {
          const isToday = d && isSameDay(d, new Date());
          const isSelected = d && selected && isSameDay(d, selected);
          const isPlaceholder = !d;
          const disabledByFilter = d && isDateDisabled?.(d);
          const isDisabled = isPlaceholder || disabledByFilter;

          const base = "h-9 w-9 inline-flex items-center justify-center rounded-md transition";
          const interactiveStyles = !isDisabled
            ? "hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2551]"
            : "";
          const disabledStyles = !isPlaceholder && isDisabled ? "text-gray-300 cursor-not-allowed" : "";
          const placeholderStyles = isPlaceholder ? "opacity-0 cursor-default" : "";
          const selectionStyles = isSelected ? "bg-[#DC2551] hover:bg-[#DC2551]/90 text-white" : "";
          const todayStyles = !isSelected && !isDisabled && isToday ? "border border-[#DC2551]" : "";

          const styles = [
            base,
            placeholderStyles,
            disabledStyles || interactiveStyles,
            selectionStyles,
            todayStyles,
          ].join(" ").trim();

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              className={styles}
              onClick={() => onDayClick(d)}
            >
              {d ? d.getDate() : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
