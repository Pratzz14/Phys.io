import { FormEvent, useState } from "react";
import { Link, useNavigate } from "../router";
import { useAuth } from "../auth/AuthProvider";
import { ArrowIcon } from "../components/Icons";
import { AuthLayout } from "../components/AuthLayout";

export function RegisterPage() {
  const { signUp } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm_password: "" }); const [error, setError] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); try { await signUp(form); navigate("/dashboard"); } catch (err) { setError(err instanceof Error ? err.message : "Unable to create account"); } };
  return <AuthLayout mode="register"><div className="auth-copy"><p className="eyebrow">Create your space</p><h1>Start your movement practice.</h1><p className="muted">Your profile stays on this local machine. Camera monitoring stays in your browser.</p></div><form onSubmit={submit} className="stack-form"><label>Username<input value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={3} pattern="\S+" title="Use 3 or more characters without spaces" autoComplete="username" placeholder="Choose a username" /></label><label>Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required autoComplete="email" placeholder="you@example.com" /></label><div className="auth-form-grid"><label>Password<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required minLength={12} autoComplete="new-password" placeholder="Create a password" /></label><label>Confirm password<input type="password" value={form.confirm_password} onChange={(event) => update("confirm_password", event.target.value)} required minLength={12} autoComplete="new-password" placeholder="Confirm password" /></label></div>{error && <p className="error-copy">{error}</p>}<button className="primary-button" type="submit">Create profile <ArrowIcon size={18} /></button></form><p className="form-footer">Already registered? <Link to="/login">Log in</Link></p></AuthLayout>;
}
