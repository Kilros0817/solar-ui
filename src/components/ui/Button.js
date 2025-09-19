"use client";

import clsx from "clsx";
import { cloneElement, isValidElement } from "react";

export default function Button({ children, className, variant = "primary", size = "md", asChild = false, ...props }) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-600)] focus:ring-[var(--primary)]",
    secondary: "bg-white/10 text-white hover:bg-white/20 focus:ring-white/30",
    outline: "border border-[var(--border)] text-[var(--foreground)] hover:bg-white/10 focus:ring-white/20",
    subtle: "bg-white/10 text-[var(--foreground)] hover:bg-white/20 focus:ring-white/20",
  };
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };

  const classes = clsx(base, variants[variant], sizes[size], className);

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: clsx(children.props.className, classes),
      ...props,
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}


