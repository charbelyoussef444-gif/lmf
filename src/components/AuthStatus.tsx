import { useAuth } from "../auth/AuthProvider";

export default function AuthStatus() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className="cursor-pointer text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition"
    >
      Sign out
    </button>
  );
}
