"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { communityDirectory } from "../../lib/community-directory";

const allCommunities = communityDirectory;

type TabKey = "Overview" | "Members" | "Meetings" | "Polls" | "Settings";

export default function CommunityDashboardPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("Overview");
  const [selectedVillage, setSelectedVillage] = useState(allCommunities[0]);
  const [selectedMemberId, setSelectedMemberId] = useState(allCommunities[0].membersList[0]?.id ?? "");
  const [pollComposerOpen, setPollComposerOpen] = useState(false);
  const [meetingComposerOpen, setMeetingComposerOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollStartDate, setPollStartDate] = useState("");
  const [pollStartTime, setPollStartTime] = useState("");
  const [pollEndDate, setPollEndDate] = useState("");
  const [pollEndTime, setPollEndTime] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("Thursday, 29 Aug");
  const [meetingTime, setMeetingTime] = useState("6:30 PM");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [pollVotes, setPollVotes] = useState<Record<string, string>>({});
  const [customPolls, setCustomPolls] = useState<Record<string, Array<{ id: string; question: string; ends: string; options: Array<{ id: string; label: string; votes: number }> }>>>({});
  const [customMeetings, setCustomMeetings] = useState<Record<string, Array<{ id: string; title: string; date: string; time: string; host: string; agenda: string }>>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const requested = params.get("community");
    const requestedTab = params.get("tab") as TabKey | null;
    const match = requested ? allCommunities.find((community) => community.slug === requested) : undefined;

    if (match) {
      setSelectedVillage(match);
      setSelectedMemberId(match.membersList[0]?.id ?? "");
    }

    if (requestedTab && ["Overview", "Members", "Meetings", "Polls", "Settings"].includes(requestedTab)) {
      setSelectedTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedPolls = JSON.parse(localStorage.getItem("ituku-community-dashboard-polls") || "{}");
      setCustomPolls(savedPolls && typeof savedPolls === "object" ? savedPolls : {});
    } catch {
      setCustomPolls({});
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ituku-community-dashboard-polls", JSON.stringify(customPolls));
    }
  }, [customPolls]);

  useEffect(() => {
    setSelectedMemberId((current) => (selectedVillage.membersList.some((member) => member.id === current) ? current : selectedVillage.membersList[0]?.id ?? ""));
  }, [selectedVillage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("community", selectedVillage.slug);
    params.set("tab", selectedTab);

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }, [selectedVillage, selectedTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedVotes = JSON.parse(localStorage.getItem("ituku-poll-votes") || "{}");
      setPollVotes(savedVotes && typeof savedVotes === "object" ? savedVotes : {});
    } catch {
      setPollVotes({});
    }
  }, []);

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

  const selectedMember = selectedVillage.membersList.find((member) => member.id === selectedMemberId) ?? selectedVillage.membersList[0];
  const visiblePolls = [...selectedVillage.polls, ...(customPolls[selectedVillage.slug] || [])];
  const visibleMeetings = [...selectedVillage.meetings, ...(customMeetings[selectedVillage.slug] || [])];

  const updateSelectedVillageMembers = (mutator: (members: typeof selectedVillage.membersList) => typeof selectedVillage.membersList) => {
    setSelectedVillage((current) => ({
      ...current,
      membersList: mutator(current.membersList),
    }));
  };

  const voteInPoll = (pollId: string, optionId: string) => {
    if (pollVotes[pollId]) return;
    setPollVotes((current) => ({ ...current, [pollId]: optionId }));
    localStorage.setItem("ituku-poll-votes", JSON.stringify({ ...pollVotes, [pollId]: optionId }));
    setSelectedVillage((current) => ({
      ...current,
      polls: current.polls.map((poll) => poll.id !== pollId ? poll : {
        ...poll,
        options: poll.options.map((option) => option.id === optionId ? { ...option, votes: option.votes + 1 } : option),
      }),
    }));
    setCustomPolls((current) => ({
      ...current,
      [selectedVillage.slug]: (current[selectedVillage.slug] || []).map((poll) => poll.id !== pollId ? poll : {
        ...poll,
        options: poll.options.map((option) => option.id === optionId ? { ...option, votes: option.votes + 1 } : option),
      }),
    }));
  };

  const handleMakeAdmin = () => {
    if (!selectedMember) return;
    updateSelectedVillageMembers((members) => members.map((member) => member.id === selectedMember.id
      ? { ...member, isAdmin: true, role: member.role === "Ordinary Member" ? "Village Executive" : member.role }
      : member));
  };

  const handleSuspendMember = () => {
    if (!selectedMember) return;
    updateSelectedVillageMembers((members) => members.map((member) => member.id === selectedMember.id
      ? { ...member, status: "Suspended 2 weeks" }
      : member));
  };

  const handleApplyFine = () => {
    if (!selectedMember) return;
    updateSelectedVillageMembers((members) => members.map((member) => member.id === selectedMember.id
      ? { ...member, fineDue: member.fineDue + 25, coinBalance: Math.max(0, member.coinBalance - 25) }
      : member));
  };

  const publishMeeting = () => {
    const title = meetingTitle.trim();
    const agenda = meetingAgenda.trim();
    if (!title || !agenda) return;

    const nextMeeting = {
      id: `local-meeting-${Date.now()}`,
      title,
      date: meetingDate.trim() || "Thursday, 29 Aug",
      time: meetingTime.trim() || "6:30 PM",
      host: "Village Chairman",
      agenda,
    };

    setCustomMeetings((current) => ({
      ...current,
      [selectedVillage.slug]: [...(current[selectedVillage.slug] || []), nextMeeting],
    }));

    setMeetingTitle("");
    setMeetingDate("Thursday, 29 Aug");
    setMeetingTime("6:30 PM");
    setMeetingAgenda("");
    setMeetingComposerOpen(false);
    setSelectedTab("Meetings");
  };

  const publishPoll = () => {
    const question = pollQuestion.trim();
    const options = pollOptions.filter((option) => option.trim());
    if (!question || options.length < 2) return;
    const startText = `${pollStartDate || "Today"}${pollStartTime ? ` at ${pollStartTime}` : ""}`;
    const endText = `${pollEndDate || "7 days from now"}${pollEndTime ? ` at ${pollEndTime}` : ""}`;
    const poll = { id: `local-${Date.now()}`, question, ends: `From ${startText} to ${endText}`, options: options.map((label, index) => ({ id: `option-${index}`, label: label.trim(), votes: 0 })) };
    setCustomPolls((current) => ({ ...current, [selectedVillage.slug]: [...(current[selectedVillage.slug] || []), poll] }));
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollStartDate("");
    setPollStartTime("");
    setPollEndDate("");
    setPollEndTime("");
    setPollComposerOpen(false);
    setSelectedTab("Polls");
  };

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
          .poll-workspace { display: grid; gap: 16px; }
          .poll-composer { display: grid; gap: 12px; padding: 22px; border: 1px solid #dbeadf; border-radius: 18px; background: linear-gradient(135deg, #f3fbf4, #fff); }
          .poll-composer h3 { margin: 0 0 6px; color: #112117; }
          .poll-composer p { margin: 0; color: #5d7063; line-height: 1.6; }
          .poll-composer input { width: 100%; padding: 12px 13px; border: 1px solid #dce9de; border-radius: 10px; background: #fff; }
          .poll-option-editor { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .poll-primary { width: max-content; border: 0; border-radius: 999px; padding: 11px 16px; background: #0b6737; color: #fff; font-weight: 700; cursor: pointer; }
          .poll-card-head { display: flex; justify-content: space-between; gap: 12px; }
          .poll-label { color: #0b6737; font-size: 10px; font-weight: 800; letter-spacing: .12em; }
          .poll-status { color: #8a6715; font-size: 11px; white-space: nowrap; }
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
          cursor: pointer;
          text-align: left;
          width: 100%;
          }
          .option-row:hover, .option-row.selected { border-color: #8fc39c; background: #edf8ef; }
          .option-row:disabled { opacity: 1; }
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
        .admin-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 900px) {
          .community-topbar, .meeting-grid, .poll-grid, .settings-grid, .community-overview-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .poll-option-editor { grid-template-columns: 1fr; }
          .poll-card-head { flex-direction: column; gap: 4px; }
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
            <span>Chairmen, executives and moderators</span>
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
              <button type="button" onClick={() => { setPollComposerOpen(true); setSelectedTab("Polls"); }}>Create poll</button>
              <button type="button" className="secondary" onClick={() => { setMeetingComposerOpen(true); setSelectedTab("Meetings"); }}>Schedule meeting</button>
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
                  <div key={member.id} className={`member-row ${selectedMemberId === member.id ? "selected" : ""}`} onClick={() => setSelectedMemberId(member.id)} style={{ cursor: "pointer", border: selectedMemberId === member.id ? "1px solid #8fc39c" : undefined }}>
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
            <div className="poll-workspace">
              {meetingComposerOpen && (
                <div className="poll-composer">
                  <div>
                    <p className="eyebrow">MEETING SCHEDULE</p>
                    <h3>Plan a meeting for {selectedVillage.name}</h3>
                    <p>Set the date, time and agenda so members can prepare ahead of time.</p>
                  </div>
                  <input value={meetingTitle} onChange={(event) => setMeetingTitle(event.target.value)} placeholder="Meeting title" />
                  <div className="poll-option-editor">
                    <input value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} placeholder="Date" />
                    <input value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} placeholder="Time" />
                  </div>
                  <input value={meetingAgenda} onChange={(event) => setMeetingAgenda(event.target.value)} placeholder="Agenda or purpose" />
                  <button type="button" className="poll-primary" onClick={publishMeeting}>Save meeting</button>
                </div>
              )}

              <div className="meeting-grid">
                {visibleMeetings.map((meeting) => (
                  <div key={meeting.id} className="meeting-card">
                    <h4>{meeting.title}</h4>
                    <p><strong>Date:</strong> {meeting.date}</p>
                    <p><strong>Time:</strong> {meeting.time}</p>
                    <p><strong>Host:</strong> {meeting.host}</p>
                    <p><strong>Agenda:</strong> {meeting.agenda}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === "Polls" && (
            <div className="poll-workspace">
              {pollComposerOpen && <div className="poll-composer"><div><p className="eyebrow">COMMUNITY VOTE</p><h3>Host a vote for {selectedVillage.name}</h3><p>Ask one clear question and give members at least two choices.</p></div><input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="What should the community decide?" /><div className="poll-option-editor">{pollOptions.map((option, index) => <input key={index} value={option} onChange={(event) => setPollOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Option ${index + 1}`} />)}</div><button type="button" className="poll-primary" onClick={publishPoll}>Publish vote</button></div>}
              <div className="poll-grid">
              {visiblePolls.map((poll) => (
                <div key={poll.id} className="poll-card">
                  <div className="poll-card-head"><div><span className="poll-label">COMMUNITY VOTE</span><h4>{poll.question}</h4></div><span className="poll-status">{poll.ends}</span></div>
                  <div className="option-list">
                    {poll.options.map((option) => (
                      <button key={option.id} type="button" className={`option-row ${pollVotes[poll.id] === option.id ? "selected" : ""}`} onClick={() => voteInPoll(poll.id, option.id)} disabled={Boolean(pollVotes[poll.id])}>
                        <span>{option.label}{pollVotes[poll.id] === option.id ? " · Your vote" : ""}</span>
                        <strong>{option.votes}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              </div>
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
                <p>Village leaders, youth leaders and assigned moderators are community admins. They can appoint additional admins, adjust role access, manage member suspension, impose coin-based fines and restore access after payment.</p>
                {selectedMember ? (
                  <div style={{ margin: "12px 0 0", padding: "10px 12px", border: "1px solid #edf2ee", borderRadius: 12, background: "#fafcfb" }}>
                    <strong>{selectedMember.name}</strong>
                    <div style={{ color: "#5d6d62", marginTop: 4 }}>{selectedMember.role} · {selectedMember.status}</div>
                  </div>
                ) : null}
                <div className="admin-actions">
                  <button type="button" onClick={handleMakeAdmin} disabled={!selectedMember || selectedMember.isAdmin}>Already admin</button>
                  <button type="button" className="secondary" onClick={handleSuspendMember} disabled={!selectedMember || selectedMember.status !== "Active"}>Suspend member</button>
                  <button type="button" className="secondary" onClick={handleApplyFine}>Apply fine</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
