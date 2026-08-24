"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { adminDirectory } from "../../lib/moderation";

const groupRoutes: Record<string, string> = {
  "Youth Circle": "g1",
  "Women Market Forum": "g2",
  "Community Development": "g3",
};

export default function GroupAdminsPage() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Youth Circle");

  useEffect(() => {
    const requested = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("group");
    if (requested) setSelectedGroup(requested);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("group", selectedGroup);

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }, [selectedGroup]);

  const groupAdmins = useMemo(
    () => adminDirectory.filter((admin) => admin.entityType === "group" && admin.entityName === selectedGroup && `${admin.name} ${admin.title} ${admin.entityName}`.toLowerCase().includes(search.toLowerCase())),
    [search, selectedGroup],
  );

  return (
    <AppShell title="Group admins" subtitle="Each group keeps its own admin roster, moderator team and governance roles.">
      <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">GROUP GOVERNANCE</p>
            <h2 style={{ margin: 0 }}>Moderator and admin directory</h2>
          </div>
          <Link href="/groups" className="text-link">Back to groups</Link>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)} style={{ width: "100%", maxWidth: 420, padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0", marginBottom: "0.75rem" }}>
            {[...new Set(adminDirectory.filter((admin) => admin.entityType === "group").map((admin) => admin.entityName))].map((groupName) => <option key={groupName}>{groupName}</option>)}
          </select>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search admins or group"
            style={{ width: "100%", maxWidth: 420, padding: "0.8rem 0.9rem", borderRadius: 12, border: "1px solid #dfe9e0" }}
          />
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
        <p className="eyebrow">GROUP WORKSPACE</p>
        <h2 style={{ margin: "0 0 0.5rem" }}>{selectedGroup}</h2>
        <p style={{ color: "#536155" }}>Open the group workspace to edit rules, assign roles, publish updates and moderate activity.</p>
        <Link href={`/groups/${groupRoutes[selectedGroup] || selectedGroup.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="button">Open group workspace</Link>
      </section>

      <section className="card-grid">
        {groupAdmins.map((admin) => (
          <article key={admin.id} className="panel-card">
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <div className="avatar" style={{ width: 52, height: 52, borderRadius: 18 }}>{admin.avatar}</div>
              <div>
                <h3 style={{ margin: 0 }}>{admin.name}</h3>
                <p style={{ margin: "0.3rem 0 0", color: "#536155" }}>{admin.title}</p>
              </div>
            </div>
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
              <div className="role-badge">{admin.position}</div>
              <p style={{ margin: 0, color: "#375042" }}>{admin.entityName}</p>
              <p style={{ margin: 0, color: "#536155" }}>{admin.description}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="status-pill">{admin.isAdmin ? "Admin" : "Member"}</span>
                <span className="status-pill warn">{admin.isModerator ? "Moderator" : "Executive"}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
