import { AppShell } from "./components/AppShell";
import { useAuth } from "./auth/AuthProvider";
import { DashboardPage } from "./pages/DashboardPage";
import { ExercisePage } from "./pages/ExercisePage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { useNavigate, usePath } from "./router";
import { useEffect } from "react";

function Redirect({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, true), [navigate, to]);
  return null;
}

export function App() {
  const { user, loading } = useAuth(); const path = usePath();
  if (loading) return <div className="loading-screen">Preparing your space…</div>;
  if (!user && path !== "/login" && path !== "/register") return <Redirect to="/login" />;
  if (user && (path === "/login" || path === "/register")) return <Redirect to="/dashboard" />;
  if (path === "/login") return <LoginPage />;
  if (path === "/register") return <RegisterPage />;
  const page = path === "/dashboard" ? <DashboardPage /> : path === "/profile" ? <ProfilePage /> : path === "/exercises" ? <ExercisesPage /> : path.startsWith("/exercise/") ? <ExercisePage /> : <div className="page-empty"><h1>Page not found</h1></div>;
  return <AppShell>{page}</AppShell>;
}
