import { NavLink, useNavigate } from "../router";
import { useAuth } from "../auth/AuthProvider";
import { ExerciseIcon, HomeIcon, LogoutIcon, UserIcon } from "./Icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className="side-rail" aria-label="Primary navigation">
        <div className="brand-mark">P</div>
        <nav className="rail-links">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "rail-link active" : "rail-link"} aria-label="Dashboard"><HomeIcon /></NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? "rail-link active" : "rail-link"} aria-label="Profile"><UserIcon /></NavLink>
          <NavLink to="/exercises" className={({ isActive }) => isActive ? "rail-link active" : "rail-link"} aria-label="Exercises"><ExerciseIcon /></NavLink>
        </nav>
        <div className="rail-bottom">
          <button className="rail-link" aria-label="Log out" onClick={() => { void signOut().then(() => navigate("/login")); }}><LogoutIcon /></button>
        </div>
      </aside>
      <main className="app-main">
        <header className="topbar">
          <div className="topbar-brand"><span className="brand-dot" /> Phys.io</div>
          <div className="topbar-user"><span>{user?.name}</span><span className="avatar-mini">{user?.name?.slice(0, 1).toUpperCase()}</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}
