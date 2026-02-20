import { useAuth } from "../auth/AuthProvider";

export default function AuthStatus() {
  const { user, signOut, loading } = useAuth();

  if (loading) return <div className="text-sm text-gray-500">—</div>;

  if (!user) {
    return (
      <a href="/login" className="text-sm rounded-xl border px-3 py-1.5 hover:bg-white">
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-700 max-w-[120px] truncate">{user.name || user.email}</div>
      <button onClick={signOut} className="text-sm rounded-xl border px-3 py-1.5 hover:bg-white">
        Sign out
      </button>
    </div>
  );
}
