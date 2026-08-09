import type { ReactNode } from "react";
import { NavLink, useNavigate } from "../router";
import { useAuth } from "../auth/AuthProvider";
import { BrandMark, ExerciseIcon, HomeIcon, LogoutIcon, UserIcon } from "./Icons";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/exercises", label: "Exercises", icon: ExerciseIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initial = user?.name?.slice(0, 1).toUpperCase() || "P";
  const logout = () => { void signOut().then(() => navigate("/login")); };

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/dashboard" className={() => "brand-lockup topbar-brand"} aria-label="Phys.io dashboard">
          <BrandMark size={30} />
          <span>Phys.io</span>
        </NavLink>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: NavIcon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "top-nav-link active" : "top-nav-link"}>
              <NavIcon size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span className="avatar-mini" aria-hidden="true">{initial}</span>
          <span className="topbar-user-name">{user?.name}</span>
          <button className="icon-button header-logout" type="button" onClick={logout} aria-label="Log out" title="Log out"><LogoutIcon size={19} /></button>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ to, label, icon: NavIcon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"}>
            <NavIcon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
