import React, { createContext, useContext, useMemo } from "react";

const Ctx = createContext({ open: false, setOpen: () => {} });

export function AlertDialog({ open = false, onOpenChange = () => {}, children }) {
  const ctx = useMemo(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function AlertDialogTrigger({ asChild = false, children }) {
  const { setOpen } = useContext(Ctx);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
    });
  }
  return (
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
      {children}
    </button>
  );
}

export function AlertDialogContent({ children, className = "" }) {
  const { open, setOpen } = useContext(Ctx);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className={["relative z-10 w-[92%] max-w-md rounded-lg bg-white p-4 shadow-lg", className].join(" ")}>{children}</div>
    </div>
  );
}

export function AlertDialogHeader({ children, className = "" }) {
  return <div className={["mb-3", className].join(" ")}>{children}</div>;
}

export function AlertDialogTitle({ children, className = "" }) {
  return <h2 className={["text-lg font-semibold", className].join(" ")}>{children}</h2>;
}

export function AlertDialogDescription({ children, className = "" }) {
  return <p className={["mt-1 text-sm text-gray-600", className].join(" ")}>{children}</p>;
}

export function AlertDialogFooter({ children, className = "" }) {
  return <div className={["mt-4 flex items-center justify-end gap-2", className].join(" ")}>{children}</div>;
}

export function AlertDialogCancel({ children = "Cancel", onClick, className = "" }) {
  const { setOpen } = useContext(Ctx);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={["rounded-md border px-3 py-1.5 text-sm", className].join(" ")}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ children = "OK", onClick, className = "" }) {
  const { setOpen } = useContext(Ctx);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={["rounded-md px-3 py-1.5 text-sm text-white bg-cyan-600 hover:bg-cyan-500", className].join(" ")}
    >
      {children}
    </button>
  );
}

export default AlertDialog;
