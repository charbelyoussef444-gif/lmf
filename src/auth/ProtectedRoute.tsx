import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Skeleton from "../components/Skeleton";
import AppHeader from "../components/AppHeader";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 transition-colors duration-300">
        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-6 lg:px-8">
          <AppHeader showNav={false} showUserBadge={false} />
          <main className="flex-1 py-8 space-y-6">
            <Skeleton className="h-5 w-48" />
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-full" variant="rect" />
            </div>
          </main>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
