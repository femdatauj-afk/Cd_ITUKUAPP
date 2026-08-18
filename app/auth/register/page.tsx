"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import logoImage from "../../../ITUKUAPP LOGO.png";
import { registerUser, requestOtpForUser, saveSession, verifyOtp } from "../../lib/api";

const villages = [
  "Amokolo",
  "Umukulu",
  "Ugwunagbo",
  "Okwenachala",
  "Ofeinyi",
  "Amata",
  "Umunevonta",
  "Umuowoh",
  "Umuonyiba",
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState(villages[0]);
  const [password, setPassword] = useState("");
  const [verificationMode, setVerificationMode] = useState<"phone" | "email">("phone");
  const [otpCode, setOtpCode] = useState("");
  const [pendingUser, setPendingUser] = useState<Record<string, any> | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await registerUser({
        fullName,
        username,
        email,
        phone,
        village,
        password,
        verificationMethod: verificationMode,
      });

      setPendingUser(response.user);
      saveSession(response);
      await requestOtpForUser(response.user.id);
      setStatusMessage(
        verificationMode === "phone"
          ? `Your account is pending activation. Enter the 6-digit code sent to ${phone || email}.`
          : `Your account is pending activation. Check ${email} for the verification code and link.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!pendingUser?.id) {
      setError("Create your account first so we can verify it.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOtp(pendingUser.id, otpCode);
      saveSession({ token: result.token, user: { ...pendingUser, isVerified: true, isActive: true, verificationStatus: 'active', verifiedBadge: 'ItukuApp Verified' } });
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify your account code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero-card">
        <div className="auth-hero-copy">
          <Link href="/" className="brand auth-brand">
            <Image src={logoImage} alt="ItukuApp logo" width={40} height={40} className="brand-logo" />
            <span>
              Ituku<span>App</span>
            </span>
          </Link>

          <p className="eyebrow">WELCOME TO THE COMMUNITY</p>
          <h1>Create your ItukuApp account</h1>
          <p className="intro">
            Join your village, build your trust profile, and complete verification before full activation.
          </p>
        </div>

        <div className="auth-form-card">
          {!pendingUser ? (
            <form className="stack" onSubmit={handleSubmit}>
              <label>
                <span>Full name</span>
                <input type="text" placeholder="Enter your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
              </label>

              <label>
                <span>Username</span>
                <input type="text" placeholder="Choose a unique username" value={username} onChange={(event) => setUsername(event.target.value)} required />
              </label>

              <div className="inline-duo">
                <label>
                  <span>Email address</span>
                  <input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>

                <label>
                  <span>Phone</span>
                  <input type="tel" placeholder="0803 000 0000" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </label>
              </div>

              <label>
                <span>Village</span>
                <select value={village} onChange={(event) => setVillage(event.target.value)}>
                  {villages.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Password</span>
                <input type="password" placeholder="Create a strong password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>

              <div className="segmented-control" aria-label="Verification method selector">
                <button type="button" className={verificationMode === "phone" ? "active" : ""} onClick={() => setVerificationMode("phone")}>Phone OTP</button>
                <button type="button" className={verificationMode === "email" ? "active" : ""} onClick={() => setVerificationMode("email")}>Email verify</button>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" required />
                <span>I agree to the terms and community standards.</span>
              </label>

              {error ? <p className="form-error">{error}</p> : null}

              <button className="button auth-button" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          ) : (
            <div className="verification-panel">
              <div className="verification-card-head">
                <p className="eyebrow">VERIFY YOUR ACCOUNT</p>
                <h2>Almost there</h2>
              </div>

              <p className="verification-copy">
                {statusMessage || `Enter the 6-digit code for ${verificationMode === "phone" ? phone || email : email}.`}
              </p>

              <label>
                <span>Verification code</span>
                <input type="text" placeholder="123456" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} maxLength={6} />
              </label>

              {error ? <p className="form-error">{error}</p> : null}

              <button className="button auth-button" type="button" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? "Verifying..." : "Activate my account"}
              </button>

              <button className="button-secondary auth-button" type="button" onClick={() => setPendingUser(null)}>
                Edit details
              </button>
            </div>
          )}

          <div className="muted-block">
            <Link href="/auth/login">Already have an account?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
