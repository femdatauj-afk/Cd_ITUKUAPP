"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { communityDirectory } from "../../lib/community-directory";

const allCommunities = communityDirectory;

type TabKey = "Overview" | "Members" | "Meetings" | "Polls" | "Settings";

export default function CommunityDashboardPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("Overview");
  const [selectedVillage, setSelectedVillage] = useState(allCommunities[0]);

  const totals = useMemo(() => {
    const totalMembers = allCommunities.reduce((sum, community) => sum + community.members, 0);
    const totalAdmins = allCommunities.reduce(
      (sum, community) => sum + community.membersList.filter((member) => member.isAdmin).length,
      0,
    );
    const totalFines = allCommunities.reduce(
      (sum, community) => sum + community.membersList.reduce((inner, member) => inner + member.fineDue, 0),
      0,
    );

    return { totalMembers, totalAdmins, totalFines };
  }, [selectedVillage]);

  return (
    <>
      <style jsx global>{`
        .community-dashboard-shell {
          display: grid;
          gap: 22px;
        }
        .community-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .metric-card, .panel-card, .village-card, .settings-card, .poll-card, .meeting-card {
          background: linear-gradient(180deg, #fff, #f9fbf7);
          border: 1px solid #e5eee3;
          border-radius: 22px;
          box-shadow: 0 14px 26px rgba(17, 24, 39, 0.04);
        }
        .metric-card {
          padding: 20px 18px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .metric-card:hover, .village-card:hover, .poll-card:hover, .meeting-card:hover { transform: translateY(-2px); }
        .metric-card .label {
          display: block;
          color: #5a6d60;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .metric-card strong {
          display: block;
          font-size: 2rem;
          color: #112117;
          letter-spacing: -0.05em;
        }
        .metric-card span {
          display: block;
          margin-top: 6px;
          color: #607365;
          font-size: 12px;
        }
        .community-topbar {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
        }
        .panel-card {
          padding: 20px;
        }
        .panel-card h3 {
          margin: 0 0 16px;
          font-size: 1.25rem;
          color: #112117;
        }
        .village-list {
          display: grid;
          gap: 12px;
        }
        .village-card {
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .village-card.active {
          border-color: rgba(11, 103, 55, 0.3);
          background: linear-gradient(135deg, #edf9f0, #fff);
        }
        .village-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #dff5e7, #dfeefb);
          color: #0b6737;
          font-weight: 800;
        }
        .village-meta {
          flex: 1;
          min-width: 0;
        }
        .village-meta strong {
          display: block;
          color: #122118;
          font-size: 1.05rem;
        }
        .village-meta span {
          color: #5f6d63;
          font-size: 12px;
        }
        .mini-stat { font-size: 11px; color: #587163; }
        .community-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px 0 18px;
          border-bottom: 1px solid #ebf0eb;
        }
        .community-tabs button {
          border: 1px solid #e4ebdf;
          background: #fff;
          color: #30473f;
          padding: 9px 12px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
        }
        .community-tabs button.active {
          background: #0b6737;
          color: #fff;
          border-color: #0b6737;
        }
        .content-stack {
          display: grid;
          gap: 18px;
        }
        .feed-item, .member-row, .meeting-card, .poll-card, .settings-card {
          padding: 16px 18px;
          background: #fff;
          border: 1px solid #ebf0ea;
          border-radius: 18px;
        }
        .feed-item strong {
          display: block;
          font-size: 1rem;
          color: #1b2a1f;
        }
        .feed-item small {
          color: #6a7d6f;
        }
        .feed-item p {
          margin: 12px 0 0;
          color: #495a4f;
          line-height: 1.7;
        }
        .member-list {
          display: grid;
          gap: 10px;
        }
        .member-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .member-row .user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .member-avatar {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #edf9f0, #dfeefb);
          color: #0b6737;
          font-weight: 800;
        }
        .role-badge, .status-tag, .fine-tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-weight: 700;
        }
        .role-badge {
          padding: 6px 10px;
          background: #edf7f2;
          color: #185d39;
          font-size: 11px;
        }
        .status-tag {
          padding: 6px 10px;
          background: #fff8dc;
          color: #8b6500;
          font-size: 11px;
        }
        .fine-tag {
          padding: 6px 10px;
          background: #fce9ea;
          color: #9b1c2b;
          font-size: 11px;
        }
        .meeting-grid, .poll-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .meeting-card h4, .poll-card h4 {
          margin: 0 0 10px;
          color: #10261a;
          font-size: 1.05rem;
        }
        .meeting-card p, .poll-card p, .settings-card p {
          margin: 8px 0;
          color: #4e5f55;
          line-height: 1.6;
        }
        .option-list {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }
        .option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 12px;
          border: 1px solid #edf2ee;
          border-radius: 12px;
          background: #fafcfb;
        }
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .settings-card ul {
          margin: 12px 0 0;
          padding-left: 18px;
          color: #485d52;
          line-height: 1.8;
        }
        .admin-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .admin-actions button {
          border: 0;
          border-radius: 999px;
          padding: 9px 12px;
          background: #0b6737;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-actions button.secondary {
          background: #f5f7f4;
          color: #1d2f24;
        }
        @media (max-width: 900px) {
          .community-topbar, .meeting-grid, .poll-grid, .settings-grid, .community-overview-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="community-dashboard-shell">
        <div className="community-overview-grid">
          <div className="metric-card">
            <span className="label">Total members</span>
            <strong>{totals.totalMembers.toLocaleString()}</strong>
            <span>Across all 9 Ituku villages</span>
          </div>
          <div className="metric-card">
            <span className="label">Community admins</span>
            <strong>{totals.totalAdmins}</strong>
            <span>Chairmen and executive leaders</span>
          </div>
          <div className="metric-card">
            <span className="label">Outstanding fines</span>
            <strong>{totals.totalFines} coin</strong>
            <span>Settled before restrictions are lifted</span>
          </div>
        </div>

        <div className="community-topbar">
          <div className="panel-card">
            <h3>Village communities</h3>
            <div className="village-list">
              {allCommunities.map((community) => (
                <div
                  key={community.slug}
                  className={`village-card ${selectedVillage.slug === community.slug ? "active" : ""}`}
                  onClick={() => setSelectedVillage(community)}
                >
                  <span className="village-pill">{community.name.slice(0, 2).toUpperCase()}</span>
                  <div className="village-meta">
                    <strong>{community.name}</strong>
                    <span>{community.members.toLocaleString()} members · {community.online} online</span>
                  </div>
                  <div className="mini-stat">{community.region}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <h3>{selectedVillage.name}</h3>
            <p style={{ margin: "0 0 12px", color: "#4d5f55", lineHeight: 1.7 }}>{selectedVillage.summary}</p>
            <div className="admin-actions">
              <button type="button">Create poll</button>
              <button type="button" className="secondary">Schedule meeting</button>
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <div className="role-badge">Village motto: {selectedVillage.motto}</div>
              <div className="fine-tag">Community coin reserve: {selectedVillage.coinBalance} coin</div>
            </div>
          </div>
        </div>

        <div className="community-tabs">
          {(["Overview", "Members", "Meetings", "Polls", "Settings"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={selectedTab === tab ? "active" : ""}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="content-stack">
          {selectedTab === "Overview" && (
            <>
              <div className="panel-card">
                <h3>Latest community updates</h3>
                <div className="member-list">
                  {selectedVillage.feed.map((post) => (
                    <div key={post.id} className="feed-item">
                      <strong>{post.author}</strong>
                      <small>{post.role} · {post.time}</small>
                      <p>{post.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedTab === "Members" && (
            <div className="panel-card">
              <h3>Community members</h3>
              <div className="member-list">
                {selectedVillage.membersList.map((member) => (
                  <div key={member.id} className="member-row">
                    <div className="user">
                      <div className="member-avatar">{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                      <div>
                        <strong>{member.name}</strong>
                        <div style={{ color: "#5d6d62", fontSize: 12 }}>{member.role}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="role-badge">{member.isAdmin ? "Admin" : "Member"}</span>
                      <span className="status-tag">{member.status}</span>
                      {member.fineDue > 0 && <span className="fine-tag">Fine: {member.fineDue} coin</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === "Meetings" && (
            <div className="meeting-grid">
              {selectedVillage.meetings.map((meeting) => (
                <div key={meeting.id} className="meeting-card">
                  <h4>{meeting.title}</h4>
                  <p><strong>Date:</strong> {meeting.date}</p>
                  <p><strong>Time:</strong> {meeting.time}</p>
                  <p><strong>Host:</strong> {meeting.host}</p>
                  <p><strong>Agenda:</strong> {meeting.agenda}</p>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "Polls" && (
            <div className="poll-grid">
              {selectedVillage.polls.map((poll) => (
                <div key={poll.id} className="poll-card">
                  <h4>{poll.question}</h4>
                  <p>{poll.ends}</p>
                  <div className="option-list">
                    {poll.options.map((option) => (
                      <div key={option.id} className="option-row">
                        <span>{option.label}</span>
                        <strong>{option.votes}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "Settings" && (
            <div className="settings-grid">
              <div className="settings-card">
                <h3>Community guidelines</h3>
                <ul>
                  {selectedVillage.guidelines.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
              <div className="settings-card">
                <h3>Reserved positions</h3>
                <ul>
                  {selectedVillage.reservedPositions.map((position) => (
                    <li key={position.title}>
                      <strong>{position.title}</strong>
                      {position.admin ? " · Admin privileges" : " · Member role"}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="settings-card" style={{ gridColumn: "1 / -1" }}>
                <h3>Moderator and admin powers</h3>
                <p>Village Chairman and Youth Chairman are automatically community admins. They can appoint additional admins, adjust role access, manage member suspension, impose coin-based fines and restore access after payment.</p>
                <div className="admin-actions">
                  <button type="button">Make admin</button>
                  <button type="button" className="secondary">Suspend member</button>
                  <button type="button" className="secondary">Apply fine</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
