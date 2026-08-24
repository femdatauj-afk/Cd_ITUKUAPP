"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { fetchNotifications, getSession } from "../lib/api";

export default function NotificationsPage() {
  const [items, setItems] = useState<Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getSession()?.token) {
      setError("Sign in to view your notifications.");
      setLoading(false);
      return;
    }
    fetchNotifications()
      .then((response) => setItems(response.data))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Notifications are unavailable."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Notifications" subtitle="Stay close to what matters in your community.">
      <section className="section-stack" style={{ maxWidth: 760, margin: "0 auto", padding: 20 }}>
        {error && <div className="error-message">{error} <Link href="/auth/login">Log in</Link></div>}
        {loading && <p>Loading notifications...</p>}
        {!loading && !error && items.length === 0 && <p className="muted-block">You are all caught up.</p>}
        {!loading && !error && items.map((item) => (
          <article key={item.id} className="feed-post" style={{ padding: 18, marginBottom: 12 }}>
            <strong>{item.title}</strong>
            <p>{item.message}</p>
            <small>{new Date(item.createdAt).toLocaleString()}</small>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
