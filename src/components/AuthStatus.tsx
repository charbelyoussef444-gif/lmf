import { LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

export default function AuthStatus() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition"
    >
      <LogOut size={14} />
      Sign out
    </button>
  );
}
