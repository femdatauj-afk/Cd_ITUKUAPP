"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { applyModerationAction, defaultModerationEvents, type ModerationAction, type ModerationTarget } from "../lib/moderation";

const actionOptions: ModerationAction[] = ["fine", "suspend", "ban"];
const targetOptions: ModerationTarget[] = ["group", "community", "page"];

export default function ModerationCenterPage() {
  const [memberName, setMemberName] = useState("Kelechi Nnaji");
  const [entityType, setEntityType] = useState<ModerationTarget>("community");
  const [entityName, setEntityName] = useState("Amokolo");
  const [action, setAction] = useState<ModerationAction>("fine");
  const [amountCoins, setAmountCoins] = useState(25);
  const [durationLabel, setDurationLabel] = useState("2 weeks");
  const [reason, setReason] = useState("Repeated toxicity and rule violations.");
  const [events, setEvents] = useState(defaultModerationEvents);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("ituku-moderation-events") || "null");
    if (Array.isArray(saved) && saved.length > 0) {
      setEvents(saved);
    }
  }, []);

  const stats = useMemo(() => ({
    fines: events.filter((event) => event.action === "fine").length,
    suspensions: events.filter((event) => event.action === "suspend").length,
    bans: events.filter((event) => event.action === "ban").length,
  }), [events]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      // Map frontend action to backend action
      const backendActionMap: Record<ModerationAction, string> = {
        fine: "warning",
        suspend: "suspend",
        ban: "ban",
      };

      // Get auth token from localStorage
      const authData = JSON.parse(localStorage.getItem("ituku-auth") || "null");
      const token = authData?.token;

      if (!token) {
        setMessage("Error: Not authenticated. Please log in.");
        setIsSubmitting(false);
        return;
      }

      // Parse duration to hours for backend
      let durationHours: number | undefined;
      if (action !== "ban" && durationLabel !== "Permanent") {
        const match = durationLabel.match(/(\d+)\s*(week|day|hour|month)/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          if (unit === "week") durationHours = value * 7 * 24;
          else if (unit === "day") durationHours = value * 24;
          else if (unit === "hour") durationHours = value;
          else if (unit === "month") durationHours = value * 30 * 24;
        }
      }

      // Create moderation action via backend
      const response = await fetch("http://localhost:4000/api/admin/moderation/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: memberName,
          action: backendActionMap[action],
          reason,
          durationHours,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to apply moderation action");
      }

      // Add to local event log
      const item = applyModerationAction({
        memberName,
        entityType,
        entityName,
        action,
        amountCoins,
        durationLabel,
        reason,
      });
      setEvents((current) => [item as (typeof current)[number], ...current].slice(0, 12));
      setMessage(`✓ Action applied successfully to ${memberName}`);

      // Clear form
      setTimeout(() => {
        setMemberName("");
        setAction("fine");
        setAmountCoins(25);
        setDurationLabel("2 weeks");
        setReason("");
      }, 1500);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell title="Moderation center" subtitle="A private ItukuApp enforcement hub for fines, suspensions and bans across communities, groups and pages.">
      <section className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <article className="panel-card">
          <p className="eyebrow">COIN ENFORCEMENT</p>
          <h3 style={{ margin: 0 }}>{stats.fines}</h3>
          <p>Recorded fines</p>
        </article>
        <article className="panel-card">
          <p className="eyebrow">SUSPENSIONS</p>
          <h3 style={{ margin: 0 }}>{stats.suspensions}</h3>
          <p>Temporary removals</p>
        </article>
        <article className="panel-card">
          <p className="eyebrow">BANS</p>
          <h3 style={{ margin: 0 }}>{stats.bans}</h3>
          <p>Permanent blocks</p>
        </article>
      </section>

      <div className="card-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
        <form className="panel-card" onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <p className="eyebrow">ENFORCEMENT ACTION</p>
            <h2 style={{ margin: 0 }}>Fine, suspend or ban member</h2>
          </div>

          <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Member name" style={{ padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }} />
            <select value={entityType} onChange={(event) => setEntityType(event.target.value as ModerationTarget)} style={{ padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }}>
              {targetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <input value={entityName} onChange={(event) => setEntityName(event.target.value)} placeholder="Community, group or page" style={{ padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }} />
            <select value={action} onChange={(event) => setAction(event.target.value as ModerationAction)} style={{ padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }}>
              {actionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <input type="number" min={0} value={amountCoins} onChange={(event) => setAmountCoins(Number(event.target.value))} placeholder="Coin fine" style={{ padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }} />
            <input value={durationLabel} onChange={(event) => setDurationLabel(event.target.value)} placeholder="Duration or 'Permanent'" style={{ padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }} />
          </div>

          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for enforcement" rows={4} style={{ resize: "vertical", padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }} />

          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Applying..." : "Apply action"}
            </button>
            <Link href="/groups/admins" className="text-link">See admin roster</Link>
            {message && <span style={{ fontSize: "0.9rem", color: message.startsWith("Error") ? "#c83d3d" : "#1b5c3d" }}>{message}</span>}
          </div>
        </form>

        <aside className="panel-card">
          <p className="eyebrow">POLICY</p>
          <h3 style={{ marginTop: 0 }}>Enforcement rules</h3>
          <ul className="mini-list">
            <li>Only active admins and moderators can apply a fine, suspension or ban.</li>
            <li>Any suspension remains active until the required ItukuApp coin fine is cleared.</li>
            <li>Harassment, misinformation, abuse and repeated rule violations are priority cases.</li>
            <li>Ban actions require clear evidence and administrator approval.</li>
          </ul>
        </aside>
      </div>

      <section className="panel-card" style={{ marginTop: "1.5rem" }}>
        <p className="eyebrow">RECENT ENFORCEMENT</p>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          {events.map((event) => (
            <div key={event.id} style={{ border: "1px solid #edf0ee", borderRadius: 14, padding: "0.9rem 1rem", display: "grid", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <strong>{event.memberName}</strong>
                <span className="status-pill alert">{event.action}</span>
              </div>
              <div style={{ color: "#42564e" }}>{event.entityName} · {event.entityType}</div>
              <div style={{ color: "#5a6f62" }}>{event.reason}</div>
              <div style={{ color: "#1b5c3d", fontWeight: 700 }}>{event.amountCoins} coin · {event.durationLabel}</div>
              <small>{event.createdAt}</small>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
