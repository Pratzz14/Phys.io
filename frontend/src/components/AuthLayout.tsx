import type { ReactNode } from "react";
import { Link } from "../router";
import { BrandMark, LockIcon } from "./Icons";
import { MovementVisual } from "./MovementVisual";

export function AuthLayout({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  return (
    <div className="auth-page">
      <section className="auth-visual">
        <Link className="brand-lockup auth-brand" to="/login"><BrandMark size={31} /><span>Phys.io</span></Link>
        <div className="auth-visual-copy"><p className="eyebrow">Private movement practice</p><h2>Make space to move.</h2><p>Real-time guidance that stays in your browser and on your device.</p></div>
        <div className="auth-pose"><span className="corner-bracket bracket-tl" /><span className="corner-bracket bracket-tr" /><span className="corner-bracket bracket-bl" /><span className="corner-bracket bracket-br" /><MovementVisual variant="shoulder" /></div>
        <div className="auth-privacy"><LockIcon size={18} /> Your movement data stays on this device.</div>
      </section>
      <section className="auth-panel">
        <Link className="brand-lockup auth-brand-mobile" to="/login"><BrandMark size={30} /><span>Phys.io</span></Link>
        <div className="auth-mode-switch" role="tablist" aria-label="Authentication">
          <Link className={mode === "login" ? "auth-mode active" : "auth-mode"} to="/login" role="tab" aria-selected={mode === "login"}>Log in</Link>
          <Link className={mode === "register" ? "auth-mode active" : "auth-mode"} to="/register" role="tab" aria-selected={mode === "register"}>Create account</Link>
        </div>
        {children}
      </section>
    </div>
  );
}
