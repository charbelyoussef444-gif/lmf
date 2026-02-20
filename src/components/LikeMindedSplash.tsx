import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type Props = {
  onDone?: () => void;
  size?: number; // px, defaults below
};

/**
 * Splash sequence (images only):
 * 1) Show one merged bubble (app icon).
 * 2) Fade merged out while two bubbles fade in and slide apart.
 * 3) Small settle/bounce, then onDone() to remove overlay.
 */
export default function LikeMindedSplash({ onDone, size = 220 }: Props) {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      onDone?.();
      return;
    }
    const totalMs = 1600; // keep in sync with transitions below
    const t = setTimeout(() => onDone?.(), totalMs);
    return () => clearTimeout(t);
  }, [prefersReduced, onDone]);

  if (prefersReduced) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white">
      <div className="relative pointer-events-none" style={{ width: size * 2.2, height: size * 1.2 }}>
        {/* 1) Merged icon in the center */}
        <motion.img
          src="/brand/lm-merged.png"
          alt="LikeMinded"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.95] }}
          transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1], ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: size, height: size }}
        />

        {/* 2) Heart bubble (left) */}
        <motion.img
          src="/brand/lm-heart.png"
          alt="Heart bubble"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.98 }}
          animate={{ opacity: [0, 1], x: [-10, -110, -96], scale: [0.98, 1, 1] }}
          transition={{ delay: 0.6, duration: 0.9, times: [0, 0.7, 1], ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: size * 0.82, height: size * 0.82 }}
        />

        {/* 2) Brain bubble (right) */}
        <motion.img
          src="/brand/lm-brain.png"
          alt="Brain bubble"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.98 }}
          animate={{ opacity: [0, 1], x: [10, 110, 96], scale: [0.98, 1, 1] }}
          transition={{ delay: 0.6, duration: 0.9, times: [0, 0.7, 1], ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: size * 0.82, height: size * 0.82 }}
        />
      </div>
    </div>
  );
}
