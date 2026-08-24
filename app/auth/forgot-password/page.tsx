"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setMessage("If an account matches that email, password reset instructions have been sent.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request a password reset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-form-card" style={{ maxWidth: 480, margin: "10vh auto" }}>
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Reset your password</h1>
        <p className="intro">Enter your account email and we will send the next secure step.</p>
        <form className="stack" onSubmit={submit}>
          <label>
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="button auth-button" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset instructions"}
          </button>
        </form>
        <div className="muted-block"><Link href="/auth/login">Back to login</Link></div>
      </section>
    </main>
  );
}
