// src/components/ui/popover.jsx
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const PopoverCtx = createContext(null);

export function Popover({ open: openProp, onOpenChange, children }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof openProp === "boolean";
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (next) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const triggerRef = useRef(null);
  const value = useMemo(() => ({ open, setOpen, triggerRef }), [open]);

  return <PopoverCtx.Provider value={value}>{children}</PopoverCtx.Provider>;
}

export function PopoverTrigger({ asChild = false, children }) {
  const { open, setOpen, triggerRef } = useContext(PopoverCtx);
  const child = React.Children.only(children);

  const onClick = (e) => {
    child.props?.onClick?.(e);
    setOpen(!open);
  };

  return asChild
    ? React.cloneElement(child, {
        ref: mergeRefs(child.ref, triggerRef),
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        onClick,
      })
    : (
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onClick}
        className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
      >
        {children}
      </button>
    );
}

export function PopoverContent({
  className = "",
  side = "bottom",           // "bottom" | "top"
  align = "center",          // "start" | "center" | "end"
  collisionPadding = 8,
  children,
}) {
  const { open, setOpen, triggerRef } = useContext(PopoverCtx);
  const contentRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0 });

  // Close on outside click / ESC
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!contentRef.current) return;
      if (contentRef.current.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, triggerRef]);

  // Basic positioning relative to trigger
  useLayoutEffect(() => {
    if (!open) return;
    const trig = triggerRef.current;
    const node = contentRef.current;
    if (!trig || !node) return;

    const t = trig.getBoundingClientRect();
    const vw = window.innerWidth;
    const minWidth = t.width; // match trigger width

    let left = t.left;
    if (align === "center") left = t.left + t.width / 2;
    if (align === "end") left = t.right;

    // initial y based on side
    let top = side === "top" ? t.top - collisionPadding : t.bottom + collisionPadding;

    // convert to page coords
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    // horizontal align transform (we’ll use translateX in style)
    setPos({
      top: top + scrollY,
      left: Math.min(Math.max(left + scrollX, collisionPadding), vw - collisionPadding),
      minWidth,
    });
  }, [open, triggerRef, side, align, collisionPadding]);

  if (!open) return null;

  const translateX =
    align === "center" ? "-50%" : align === "end" ? "-100%" : "0%";

  return createPortal(
    <div
      ref={contentRef}
      role="dialog"
      className={[
        "z-50 rounded-md border bg-white shadow-lg outline-none",
        "animate-in fade-in-0 zoom-in-95",
        className,
      ].join(" ")}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        transform: `translateX(${translateX})`,
        minWidth: pos.minWidth,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

/* -------- utils -------- */
function mergeRefs(...refs) {
  return (node) => {
    for (const r of refs) {
      if (!r) continue;
      if (typeof r === "function") r(node);
      else r.current = node;
    }
  };
}
