// iOS-style mobile header. Large title variant (root screen) and standard
// pushed-screen title variant with a back arrow.

import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface MobileHeaderProps {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Hide chevron back button */
  noBack?: boolean;
}

export default function MobileHeader({
  title,
  onBack,
  right,
  noBack,
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const handleBack = () => (onBack ? onBack() : navigate(-1));
  return (
    <header className="m-header sticky top-0 z-30">
      <div className="flex w-11 items-center">
        {!noBack ? (
          <button
            type="button"
            className="m-header-btn -ml-2"
            onClick={handleBack}
            aria-label="Back"
          >
            <ChevronLeft size={28} />
          </button>
        ) : null}
      </div>
      <div className="m-header-title truncate text-center flex-1">{title}</div>
      <div className="flex w-11 items-center justify-end">{right}</div>
    </header>
  );
}

// Large-title variant used on root screens (Matches, Assessment, Profile)
export function MobileLargeTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="px-4 pt-2 pb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-large-title text-[color:var(--m-text-primary)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="m-subhead mt-1 text-[color:var(--m-text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {right}
      </div>
    </div>
  );
}
