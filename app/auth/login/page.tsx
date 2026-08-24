"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import logoImage from "../../../ITUKUAPP LOGO.png";
import { getSession, loginUser, saveSession } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const demoDeveloper = {
    identifier: "Henry-Of-Ituku",
    password: "slimkid0042",
  };
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ identifier, password });
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (!response.token || typeof response.token !== 'string' || response.token.length === 0) {
        throw new Error('Authentication failed: no token received');
      }

      if (!response.user || typeof response.user !== 'object') {
        throw new Error('Authentication failed: user data not found');
      }

      const user = response.user as Record<string, any>;
      if (!user.id && !user.email) {
        throw new Error('Authentication failed: incomplete user data');
      }

      // Save session and redirect only after validation
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

    const currentSession = getSession();
    if (currentSession?.token && currentSession?.user) {
      router.replace("/feed");
    }
  }, [router]);

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
