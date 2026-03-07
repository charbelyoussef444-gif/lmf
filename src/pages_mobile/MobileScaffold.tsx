import { type ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, MessageCircle, User, Sparkles, Shield } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const tabs = [
  { to: "/m", label: "Home", icon: Home },
  { to: "/m/conversations", label: "Chats", icon: MessageCircle },
  { to: "/m/chatbot", label: "Assessment", icon: Sparkles },
  { to: "/m/profile", label: "Profile", icon: User },
];

const menuLinks = [...tabs, { to: "/m/admin", label: "Admin", icon: Shield }];

export default function MobileScaffold({ title, subtitle, children }: Props) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const active = useMemo(() => location.pathname, [location.pathname]);

  return (
    <div className="mobile-shell min-h-screen bg-[#f2f2f7] text-[#1c1c1e] dark:bg-black dark:text-white">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-xl dark:bg-[#0f0f11]">
        <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur dark:border-white/10 dark:bg-[#0f0f11]/95">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2f2f7] dark:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8e8e93]">LikeMinded</p>
              <h1 className="text-[26px] font-semibold leading-7">{title}</h1>
            </div>
            <div className="h-11 w-11" />
          </div>
          {subtitle ? (
            <p className="mt-2 text-center text-sm text-[#636366] dark:text-[#a1a1aa]">{subtitle}</p>
          ) : null}
        </header>

        <main className="mobile-content px-3 pb-[calc(92px+env(safe-area-inset-bottom))] pt-3">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 items-center justify-between border-t border-black/10 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-white/10 dark:bg-[#111114]/95">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.to || active.startsWith(`${tab.to}/`);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex min-w-[72px] flex-col items-center rounded-2xl px-2 py-1 text-[11px] ${
                  isActive ? "text-[#007aff]" : "text-[#8e8e93]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <button className="flex-1 bg-black/35" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="h-full w-[82%] max-w-xs bg-white p-5 dark:bg-[#151518]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8e8e93]">Navigation</p>
                <h2 className="text-2xl font-semibold">Menu</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2f2f7] dark:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {menuLinks.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.to || active.startsWith(`${item.to}/`);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${
                      isActive ? "bg-[#007aff]/10 text-[#007aff]" : "text-[#1c1c1e] dark:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
