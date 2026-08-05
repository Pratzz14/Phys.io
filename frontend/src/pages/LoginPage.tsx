import { FormEvent, useState } from "react";
import { Link, useNavigate } from "../router";
import { useAuth } from "../auth/AuthProvider";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try { await signIn(email, password); navigate("/dashboard"); } catch (err) { setError(err instanceof Error ? err.message : "Unable to log in"); }
  };
  return <div className="auth-page"><div className="auth-panel"><div className="brand-lockup"><span className="brand-dot" /> Phys.io</div><h1>Move with confidence.</h1><p className="muted">Private, browser-based exercise monitoring for your daily movement.</p><form onSubmit={submit} className="stack-form"><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>{error && <p className="error-copy">{error}</p>}<button className="primary-button" type="submit">Log in <span>→</span></button></form><p className="form-footer">New to Phys.io? <Link to="/register">Create an account</Link></p></div><div className="auth-art"><div className="art-orbit" /><div className="pose-line">✦</div><span>Movement, made personal.</span></div></div>;
}
