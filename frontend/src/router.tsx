import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface RouterContextValue { path: string; navigate: (to: string, replace?: boolean) => void; }
const RouterContext = createContext<RouterContextValue | null>(null);

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const value = useMemo(() => ({
    path,
    navigate: (to: string, replace = false) => {
      if (replace) window.history.replaceState({}, "", to); else window.history.pushState({}, "", to);
      setPath(to.split("?")[0]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  }), [path]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useNavigate must be used inside Router");
  return context.navigate;
}

export function usePath() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("usePath must be used inside Router");
  return context.path;
}

export function Link({ to, children, className, onClick, ...rest }: { to: string; children: ReactNode; className?: string; onClick?: () => void } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const navigate = useNavigate();
  return <a {...rest} href={to} className={className} onClick={(event) => { onClick?.(); if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || rest.target === "_blank") return; event.preventDefault(); navigate(to); }}>{children}</a>;
}

export function NavLink({ to, children, className, "aria-label": ariaLabel }: { to: string; children: ReactNode; className: (args: { isActive: boolean }) => string; "aria-label"?: string }) {
  const path = usePath();
  return <Link to={to} className={className({ isActive: path === to || path.startsWith(`${to}/`) })} aria-label={ariaLabel}>{children}</Link>;
}
