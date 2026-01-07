import React from "react";

const variants = {
  default: "bg-gray-100 text-gray-800",
  secondary: "bg-[#DC2551] hover:bg-[#DC2551]/90 text-white",
  destructive: "bg-rose-100 text-rose-700",
  success: "bg-emerald-100 text-emerald-700",
};

export function Badge({ variant = "default", className = "", children, ...props }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const v = variants[variant] || variants.default;
  return (
    <span className={[base, v, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}

export default Badge;
