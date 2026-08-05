import { FormEvent, useState } from "react";
import { Link, useNavigate } from "../router";
import { useAuth } from "../auth/AuthProvider";

export function RegisterPage() {
  const { signUp } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm_password: "" }); const [error, setError] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); try { await signUp(form); navigate("/dashboard"); } catch (err) { setError(err instanceof Error ? err.message : "Unable to create account"); } };
  return <div className="auth-page"><div className="auth-panel"><div className="brand-lockup"><span className="brand-dot" /> Phys.io</div><h1>Start your movement practice.</h1><p className="muted">Your profile stays on this local machine. Camera monitoring stays in your browser.</p><form onSubmit={submit} className="stack-form"><label>Username<input value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={3} pattern="\S+" title="Use 3 or more characters without spaces" autoComplete="username" /></label><label>Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required minLength={12} autoComplete="new-password" /></label><label>Confirm password<input type="password" value={form.confirm_password} onChange={(event) => update("confirm_password", event.target.value)} required minLength={12} autoComplete="new-password" /></label>{error && <p className="error-copy">{error}</p>}<button className="primary-button" type="submit">Create profile <span>→</span></button></form><p className="form-footer">Already registered? <Link to="/login">Log in</Link></p></div><div className="auth-art register-art"><div className="art-ring" /><div className="art-leaf">◒</div><span>Make space to move.</span></div></div>;
}
