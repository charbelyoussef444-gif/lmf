import { Link } from "react-router-dom";
import AuthStatus from "./AuthStatus";

type Props = {
  className?: string;
  showAuthStatus?: boolean;
};

export default function AppFooter({ className, showAuthStatus = true }: Props) {
  return (
    <footer
      className={`border-t border-slate-200 py-4 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400 ${
        className || ""
      }`}
    >
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} LikeMinded.</span>
          <span className="hidden sm:inline">
            Built for people who want clarity before connection.
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-300">
            Home
          </Link>
          <Link to="/chatbot" className="hover:text-indigo-600 dark:hover:text-indigo-300">
            Assessment
          </Link>
          <Link to="/profile" className="hover:text-indigo-600 dark:hover:text-indigo-300">
            Profile
          </Link>
          {showAuthStatus ? <AuthStatus /> : null}
        </div>
      </div>
    </footer>
  );
}