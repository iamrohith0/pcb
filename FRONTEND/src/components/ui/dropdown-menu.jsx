// dropdown-menu.jsx
import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";

const Ctx = createContext({ open: false, setOpen: () => {} });

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const ctx = useMemo(() => ({ open, setOpen }), [open]);
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function DropdownMenuTrigger({ asChild = false, children }) {
  const { setOpen, open } = useContext(Ctx);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(!open);
      },
      'aria-expanded': open,
      'aria-haspopup': true,
      // remove blue ring on trigger focus
      className: [
        children.props.className,
        "focus:outline-none focus:ring-0"
      ].join(" "),
    });
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup
      className="focus:outline-none focus:ring-0"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ align = "start", className = "", children }) {
  const { open, setOpen } = useContext(Ctx);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, setOpen]);

  if (!open) return null;

  const alignment = align === "end" ? "origin-top-right right-0" : "origin-top-left left-0";

  return (
    <div
      ref={ref}
      className={[
        
        "z-50 mt-2 min-w-[10rem] rounded-md border border-gray-300 bg-gray-100 p-1 shadow-md text-gray-800",
        alignment,
        className
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className = "" }) {
  return (
    <div className={["px-2 py-1 text-xs font-semibold text-gray-700", className].join(" ")}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-300" />;
}

export function DropdownMenuItem({ asChild = false, onSelect, children, className = "" }) {
  const { setOpen } = useContext(Ctx);

  const itemBase =
    "block w-full rounded px-2 py-1.5 text-left text-sm text-gray-800 " +
    "hover:bg-gray-200 focus:bg-gray-200 active:bg-gray-300 " +
    "outline-none focus:outline-none focus:ring-0";

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        onSelect?.();
        setOpen(false);
      },
      className: [children.props.className, itemBase, className].join(" "),
    });
  }

  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      className={[itemBase, className].join(" ")}
    >
      {children}
    </button>
  );
}

export default DropdownMenu;
