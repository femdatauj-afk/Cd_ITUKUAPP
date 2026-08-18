"use client";

import Link from "next/link";
import { adminDirectory } from "../../lib/moderation";
import { AppShell } from "../../components/app-shell";

export default function CommunitiesAdminsPage() {
  const communityAdmins = adminDirectory.filter((admin) => admin.entityType === "community");

  return (
    <AppShell title="Community admins" subtitle="Every community keeps separate admin authority, moderator rights and enforcement roles.">
      <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">COMMUNITY GOVERNANCE</p>
            <h2 style={{ margin: 0 }}>Village and community leadership</h2>
          </div>
          <Link href="/communities" className="text-link">Back to communities</Link>
        </div>
      </section>

      <section className="card-grid">
        {communityAdmins.map((admin) => (
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
