// src/components/Skeleton.tsx

type Props = {
  className?: string;
  /** "line" = rounded-md, "circle" = rounded-full, "rect" = rounded-2xl */
  variant?: "line" | "circle" | "rect";
};

export default function Skeleton({ className = "", variant = "line" }: Props) {
  const radius =
    variant === "circle"
      ? "rounded-full"
      : variant === "rect"
        ? "rounded-2xl"
        : "rounded-md";

  return (
    <span
      className={`block animate-pulse bg-slate-200 dark:bg-slate-700/60 ${radius} ${className}`}
    />
  );
}
