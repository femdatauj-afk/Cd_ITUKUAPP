"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import logoImage from "../../../ITUKUAPP LOGO.png";
import { loginUser, saveSession } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const demoDeveloper = {
    identifier: "Henry-Of-Ituku",
    password: "slimkid0042",
  };
  const [identifier, setIdentifier] = useState(demoDeveloper.identifier);
  const [password, setPassword] = useState(demoDeveloper.password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDeveloperLogin() {
    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ identifier: demoDeveloper.identifier, password: demoDeveloper.password });
      saveSession(response);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ identifier, password });
      saveSession(response);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("ituku-auth")) {
      router.push("/feed");
      return;
    }

    void handleDeveloperLogin();
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-hero-card auth-hero-card--compact">
        <div className="auth-hero-copy">
          <Link href="/" className="brand auth-brand">
            <Image src={logoImage} alt="ItukuApp logo" width={40} height={40} className="brand-logo" />
            <span>
              Ituku<span>App</span>
            </span>
          </Link>

          <p className="eyebrow">WELCOME BACK</p>
          <h1>Sign in to continue</h1>
          <p className="intro">Use your village identity and keep your community close.</p>
        </div>

        <div className="auth-form-card">
          <form className="stack" onSubmit={handleSubmit}>
            <label>
              <span>Email or username</span>
              <input type="text" placeholder="e.g. henry or you@example.com" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
            </label>

            <label>
              <span>Password</span>
              <input type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>

            <label className="checkbox-row">
              <input type="checkbox" />
              <span>Remember me for 30 days</span>
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="button auth-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </button>

            <button
              className="button-secondary auth-button"
              type="button"
              onClick={() => {
                setIdentifier(demoDeveloper.identifier);
                setPassword(demoDeveloper.password);
              }}
              style={{ width: "100%" }}
            >
              Use developer demo account
            </button>
          </form>

          <div className="muted-block">
            <Link href="/auth/register">Create an account</Link>
            <Link href="/">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
