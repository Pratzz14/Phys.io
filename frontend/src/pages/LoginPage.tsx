import { FormEvent, useState } from "react";
import { Link, useNavigate } from "../router";
import { useAuth } from "../auth/AuthProvider";
import { ArrowIcon } from "../components/Icons";
import { AuthLayout } from "../components/AuthLayout";

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
  return <AuthLayout mode="login"><div className="auth-copy"><p className="eyebrow">Welcome back</p><h1>Move with confidence.</h1><p className="muted">Private, browser-based exercise monitoring for your daily movement.</p></div><form onSubmit={submit} className="stack-form"><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Enter your password" /></label>{error && <p className="error-copy">{error}</p>}<button className="primary-button" type="submit">Log in <ArrowIcon size={18} /></button></form><p className="form-footer">New to Phys.io? <Link to="/register">Create an account</Link></p></AuthLayout>;
}
