import React from "react";

export type StatusPillVariant = "success" | "warning" | "danger" | "neutral";

interface StatusPillProps {
  variant: StatusPillVariant;
  label: string;
  showDot?: boolean;
  className?: string;
  title?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  variant,
  label,
  showDot = true,
  className = "",
  title,
}) => {
  const styles: Record<StatusPillVariant, { container: string; dot: string }> = {
    success: {
      container: "bg-accent-success-bg text-accent-success",
      dot: "bg-accent-success",
    },
    warning: {
      container: "bg-accent-warning-bg text-accent-warning",
      dot: "bg-accent-warning",
    },
    danger: {
      container: "bg-accent-danger-bg text-accent-danger",
      dot: "bg-accent-danger",
    },
    neutral: {
      container: "bg-surface-3 text-text-secondary",
      dot: "bg-text-secondary",
    },
  };

  const style = styles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-[11px] leading-[14px] uppercase tracking-[0.06em] font-semibold font-mono select-none ${style.container} ${className}`}
      title={title}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};
