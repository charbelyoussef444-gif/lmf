// Mobile-replica UI primitives. Match the native app's UI components 1:1.
// ONLY used inside the `<MobileAppShell>` scope (< md breakpoint).

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Gradient Button (primary action)
// ─────────────────────────────────────────────────────────────────────────
interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  loading?: boolean;
  variant?: "filled" | "outline";
  icon?: ReactNode;
}
export function GradientButton({
  title,
  loading,
  variant = "filled",
  icon,
  className,
  disabled,
  ...rest
}: GradientButtonProps) {
  const base =
    variant === "filled" ? "m-btn-gradient" : "m-btn-ghost";
  return (
    <button
      className={[base, className || ""].join(" ").trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-white"
          aria-hidden
        />
      ) : (
        <>
          {icon ? <span className="mr-2 inline-flex">{icon}</span> : null}
          {title}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Solid Button (alternative primary style — used on WelcomeScreen)
// ─────────────────────────────────────────────────────────────────────────
interface SolidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}
export function SolidButton({ title, className, ...rest }: SolidButtonProps) {
  return (
    <button className={["m-btn-solid", className || ""].join(" ").trim()} {...rest}>
      {title}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Ghost Button (surface background)
// ─────────────────────────────────────────────────────────────────────────
interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  icon?: ReactNode;
}
export function GhostButton({ title, icon, className, ...rest }: GhostButtonProps) {
  return (
    <button className={["m-btn-ghost", className || ""].join(" ").trim()} {...rest}>
      {icon}
      <span>{title}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Input (label above field, optional password toggle)
// ─────────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isPassword?: boolean;
  rightIcon?: ReactNode;
}
export function Input({
  label,
  error,
  isPassword,
  rightIcon,
  className,
  type,
  ...rest
}: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const resolvedType = isPassword ? (revealed ? "text" : "password") : type;

  return (
    <div className="m-input-group">
      {label ? <label className="m-input-label">{label}</label> : null}
      <div className="m-input-wrap">
        <input
          type={resolvedType}
          className={[
            "m-input",
            error ? "m-input-error" : "",
            className || "",
          ]
            .join(" ")
            .trim()}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            className="m-input-right-icon"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        ) : rightIcon ? (
          <div className="m-input-right-icon">{rightIcon}</div>
        ) : null}
      </div>
      {error ? <span className="m-input-error-text">{error}</span> : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Textarea (chat / free-text)
// ─────────────────────────────────────────────────────────────────────────
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function TextArea({ label, error, className, ...rest }: TextAreaProps) {
  return (
    <div className="m-input-group">
      {label ? <label className="m-input-label">{label}</label> : null}
      <textarea
        className={[
          "m-input",
          "min-h-[96px] py-3 leading-snug resize-none",
          error ? "m-input-error" : "",
          className || "",
        ]
          .join(" ")
          .trim()}
        {...rest}
      />
      {error ? <span className="m-input-error-text">{error}</span> : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={["m-card", className || ""].join(" ").trim()} style={style}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Chip (selectable — used for interests, genders, etc.)
// ─────────────────────────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}
export function Chip({ label, selected, onClick, icon, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "m-chip",
        selected ? "m-chip-selected" : "",
        disabled ? "opacity-50" : "",
      ]
        .join(" ")
        .trim()}
    >
      {icon ? <span className="mr-1.5 inline-flex">{icon}</span> : null}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}
export function Badge({ label, variant = "default", className }: BadgeProps) {
  const variantClass =
    variant === "default"
      ? ""
      : variant === "success"
      ? "m-badge-success"
      : variant === "warning"
      ? "m-badge-warning"
      : variant === "error"
      ? "m-badge-error"
      : "m-badge-info";
  return (
    <span className={["m-badge", variantClass, className || ""].join(" ").trim()}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────
interface AvatarProps {
  name?: string;
  size?: number;
  src?: string | null;
}
export function Avatar({ name, size = 40, src }: AvatarProps) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const fontSize = Math.round(size * 0.4);
  return (
    <div
      className="m-avatar"
      style={{ width: size, height: size, fontSize }}
    >
      {src ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={src}
          alt={name || ""}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0..1
  height?: number;
  className?: string;
}
export function ProgressBar({ progress, height = 8, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div
      className={["m-progress-track", className || ""].join(" ").trim()}
      style={{ height }}
    >
      <div className="m-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Icon circle (colored background, icon inside)
// ─────────────────────────────────────────────────────────────────────────
interface IconCircleProps {
  children: ReactNode;
  size?: number;
  bg?: string;
  className?: string;
}
export function IconCircle({ children, size = 40, bg, className }: IconCircleProps) {
  return (
    <span
      className={["m-icon-circle", className || ""].join(" ").trim()}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
      }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Loading Spinner (full-screen or inline)
// ─────────────────────────────────────────────────────────────────────────
export function LoadingSpinner({
  message,
  fullScreen = false,
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-[color:var(--m-text-secondary)]">
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-[color:var(--m-border-glass)] border-t-[color:var(--m-primary)]"
        aria-hidden
      />
      {message ? <span className="m-subhead">{message}</span> : null}
    </div>
  );
  if (!fullScreen) return content;
  return (
    <div className="m-screen flex items-center justify-center">{content}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      {icon ? (
        <div className="m-icon-circle" style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "var(--m-primary-muted)" }}>
          {icon}
        </div>
      ) : null}
      <div className="m-title3 mt-2">{title}</div>
      {description ? (
        <p className="m-subhead max-w-[280px] text-[color:var(--m-text-secondary)]">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section header (iOS-style grouped list title above a .m-list-group)
// ─────────────────────────────────────────────────────────────────────────
export function SectionHeader({ title }: { title: string }) {
  return <div className="m-section-title mt-5 px-1">{title}</div>;
}
