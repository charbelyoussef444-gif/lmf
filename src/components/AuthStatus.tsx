import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function AuthStatus() {
  const { user, signOut, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/login"
        className="cursor-pointer text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition"
      >
        Sign in
      </Link>
    );
  }

  return (
    <button
      onClick={signOut}
      className="cursor-pointer text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition"
    >
      Sign out
    </button>
  );
}
