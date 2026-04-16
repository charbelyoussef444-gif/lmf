// Mobile replica of /likeminded/src/screens/profile/InterestsScreen.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import MobileAppShell from "../../layouts/MobileAppShell";
import MobileHeader from "../../layouts/MobileHeader";
import {
  Chip,
  GradientButton,
  LoadingSpinner,
} from "../../components/Primitives";
import { api } from "../../../lib/api";

type Interest = { id: number; name: string; category?: string | null };

export default function MobileInterestsScreen() {
  const navigate = useNavigate();
  const [all, setAll] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.allInterests().catch(() => []),
      api.myInterests().catch(() => []),
    ])
      .then(([allI, mine]) => {
        if (cancelled) return;
        setAll(allI || []);
        const names = new Set((mine || []).map((i: any) => i.name));
        setSelected(names);
        setSaved(new Set(names));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(all.map((i) => i.category || "Other"));
    return Array.from(cats).sort();
  }, [all]);

  const filtered = useMemo(() => {
    let rows = all;
    if (activeCategory) {
      rows = rows.filter((i) => (i.category || "Other") === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((i) => i.name.toLowerCase().includes(q));
    }
    return rows;
  }, [all, activeCategory, search]);

  const isDirty = useMemo(() => {
    if (selected.size !== saved.size) return true;
    for (const n of selected) if (!saved.has(n)) return true;
    return false;
  }, [selected, saved]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.putInterests(Array.from(selected));
      setSaved(new Set(selected));
      alert("Your interests have been updated.");
    } catch (e: any) {
      alert(e?.message || "Failed to save interests.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MobileAppShell bare className="md:hidden">
        <MobileHeader title="Interests" onBack={() => navigate(-1)} />
        <LoadingSpinner fullScreen message="Loading interests..." />
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell bare className="md:hidden">
      <MobileHeader title="Interests" onBack={() => navigate(-1)} />

      <div className="px-4 pt-2">
        <div
          className="flex items-center gap-2 px-3 rounded-[8px]"
          style={{ backgroundColor: "var(--m-surface-tertiary)", height: 44 }}
        >
          <Search size={18} color="var(--m-text-tertiary)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interests..."
            className="flex-1 bg-transparent border-0 outline-none m-body"
            style={{ color: "var(--m-text-primary)" }}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="bg-transparent border-0"
            >
              <X size={18} color="var(--m-text-tertiary)" />
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="mt-2 flex gap-2 px-4 overflow-x-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="flex-shrink-0 rounded-full px-4 py-1.5 m-subhead"
          style={{
            fontWeight: 500,
            background:
              activeCategory === null
                ? "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))"
                : "var(--m-surface)",
            color: activeCategory === null ? "#fff" : "var(--m-text-primary)",
            border:
              activeCategory === null
                ? "none"
                : "1px solid var(--m-border-glass)",
          }}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            className="flex-shrink-0 rounded-full px-4 py-1.5 m-subhead"
            style={{
              fontWeight: 500,
              background:
                activeCategory === c
                  ? "linear-gradient(135deg, var(--m-gradient-start), var(--m-gradient-end))"
                  : "var(--m-surface)",
              color: activeCategory === c ? "#fff" : "var(--m-text-primary)",
              border:
                activeCategory === c
                  ? "none"
                  : "1px solid var(--m-border-glass)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {filtered.map((i) => (
            <Chip
              key={i.id}
              label={i.name}
              selected={selected.has(i.name)}
              onClick={() => toggle(i.name)}
            />
          ))}
          {filtered.length === 0 ? (
            <p
              className="m-body w-full text-center py-6"
              style={{ color: "var(--m-text-tertiary)" }}
            >
              No interests match your search
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="px-4 py-3"
        style={{
          borderTop: "1px solid var(--m-separator-light)",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0))",
        }}
      >
        <GradientButton
          title={isDirty ? "Save Changes" : "Saved"}
          onClick={handleSave}
          loading={saving}
          disabled={!isDirty}
        />
      </div>
    </MobileAppShell>
  );
}
