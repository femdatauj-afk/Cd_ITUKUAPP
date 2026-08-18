"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { communityDirectory } from "../../lib/community-directory";
import { rankPostsForFeed, canUserComment } from "../../lib/moderation";

type TabKey = "Overview" | "Posts" | "Admins" | "Members" | "Polls" | "Settings";

type CommentItem = {
  id: string;
  author: string;
  text: string;
  time: string;
  likes: number;
  reported: boolean;
};

type CommunityPost = {
  id: string;
  author: string;
  role: string;
  text: string;
  time: string;
  likes: number;
  shares: number;
  comments: CommentItem[];
  reported: boolean;
};

const defaultSettings = {
  allowPosting: true,
  inviteOnly: false,
  approvalForPosts: false,
  shareLocked: false,
  commentModeration: true,
  autoReportHandling: true,
  deleteBadComments: true,
  adminOnlyAnnouncements: false,
};

const cloneCommunity = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export default function VillageCommunityPage() {
  const params = useParams<{ village: string }>();
  const selectedCommunity = useMemo(() => {
    const found = communityDirectory.find((item) => item.slug === (params.village ?? "amokolo"));
    return found ?? communityDirectory[0];
  }, [params.village]);

  const [community, setCommunity] = useState(() => cloneCommunity(selectedCommunity));
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [joined, setJoined] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [composerMedia, setComposerMedia] = useState<string | null>(null);
  const [composerMediaType, setComposerMediaType] = useState<"image" | "video" | "">("");
  const [memberNotice, setMemberNotice] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>(() =>
    cloneCommunity(selectedCommunity).feed.map((post: (typeof selectedCommunity.feed)[number]) => ({
      id: post.id,
      author: post.author,
      role: post.role,
      text: post.text,
      time: post.time,
      likes: 18 + Math.floor(Math.random() * 18),
      shares: 4 + Math.floor(Math.random() * 9),
      comments: [
        {
          id: `${post.id}-c1`,
          author: "Ada Okafor",
          text: "This is a helpful update. Please keep everyone informed.",
          time: "2m ago",
          likes: 4,
          reported: false,
        },
      ],
      reported: false,
    })),
  );
  const [reportAlerts, setReportAlerts] = useState([
    { id: "r1", title: "Auto-hide rule", message: "Flagged content is hidden from the main feed until reviewed." },
    { id: "r2", title: "Coin enforcement", message: "Any fine must be paid through ItukuApp coin before a suspension is lifted." },
  ]);

  useEffect(() => {
    setCommunity(cloneCommunity(selectedCommunity));
    setPosts(
      cloneCommunity(selectedCommunity).feed.map((post: (typeof selectedCommunity.feed)[number]) => ({
        id: post.id,
        author: post.author,
        role: post.role,
        text: post.text,
        time: post.time,
        likes: 18 + Math.floor(Math.random() * 18),
        shares: 4 + Math.floor(Math.random() * 9),
        comments: [
          {
            id: `${post.id}-c1`,
            author: "Ada Okafor",
            text: "This is a helpful update. Please keep everyone informed.",
            time: "2m ago",
            likes: 4,
            reported: false,
          },
        ],
        reported: false,
      })),
    );
    setAnnouncement("");
    setActiveTab("Overview");
    setSettings(defaultSettings);
  }, [selectedCommunity]);

  const totalReactions = useMemo(
    () => posts.reduce((sum, post) => sum + post.likes + post.shares, 0),
    [posts],
  );

  const sortedPosts = useMemo<CommunityPost[]>(() => {
    const ranked = rankPostsForFeed(
      posts.map((post) => ({
        ...post,
        comments: post.comments.length,
        shares: post.shares,
      })),
    ) as Array<CommunityPost & { comments: number; shares: number }>;

    return ranked.map(
      (item) => posts.find((post) => post.id === item.id) ?? {
        ...item,
        comments: [],
        reported: false,
      },
    );
  }, [posts]);

  const handlePublishPost = () => {
    if (!announcement.trim() && !composerMedia) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: "You",
      role: "Ordinary Member",
      text: announcement.trim() || "Shared a new update with the community.",
      time: "Just now",
      likes: 0,
      shares: 0,
      comments: [],
      reported: false,
    };

    setPosts((current) => [newPost, ...current]);
    setAnnouncement("");
    setComposerMedia(null);
    setComposerMediaType("");
    setActiveTab("Posts");
  };

  const handleMemberAction = (action: "friend" | "message", personName: string) => {
    setMemberNotice(action === "friend" ? `Friend request sent to ${personName}.` : `Message opened for ${personName}.`);
    window.setTimeout(() => setMemberNotice(""), 2200);
  };

  const handleLike = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post,
      ),
    );
  };

  const handleShare = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, shares: post.shares + 1 } : post,
      ),
    );
  };

  const handleAddComment = (postId: string, value: string) => {
    if (!value.trim()) return;

    if (!canUserComment(joined)) {
      setMemberNotice("You must join the community before you can comment.");
      window.setTimeout(() => setMemberNotice(""), 2200);
      return;
    }

    const comment: CommentItem = {
      id: `comment-${Date.now()}`,
      author: "You",
      text: value.trim(),
      time: "now",
      likes: 0,
      reported: false,
    };

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post,
      ),
    );
  };

  const handleReport = (target: "post" | "comment", postId: string, commentId?: string) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;

        if (target === "post") {
          return { ...post, reported: true };
        }

        return {
          ...post,
          comments: post.comments.map((comment) =>
            comment.id === commentId ? { ...comment, reported: true } : comment,
          ),
        };
      }),
    );

    setReportAlerts((current) => [
      {
        id: `alert-${Date.now()}`,
        title: target === "post" ? "Post reported" : "Comment reported",
        message: `ItukuApp moderation flagged the ${target} for review and possible auto-moderation.`,
      },
      ...current,
    ].slice(0, 4));
  };

  const handleVote = (pollId: string, optionId: string) => {
    setCommunity((current) => ({
      ...current,
      polls: current.polls.map((poll) =>
        poll.id !== pollId
          ? poll
          : {
              ...poll,
              options: poll.options.map((option) =>
                option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
              ),
            },
      ),
    }));
    setActiveTab("Polls");
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const communityStats = [
    { label: "Members", value: community.members.toLocaleString() },
    { label: "Online", value: `${community.online}` },
    { label: "Coins", value: `${community.coinBalance} coin` },
    { label: "Reactions", value: `${totalReactions}` },
  ];

  return (
    <>
      <style jsx global>{`
        .community-page {
          display: grid;
          gap: 20px;
        }
        .community-hero {
          position: relative;
          overflow: hidden;
          padding: 24px 24px 18px;
          border-radius: 28px;
          background: linear-gradient(125deg, #0a3a29 0%, #0d7148 45%, #1fa36a 100%);
          box-shadow: 0 18px 32px rgba(9, 35, 25, 0.2);
          border: 1px solid rgba(255,255,255,0.14);
          color: white;
        }
        .community-hero::after {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 50%;
          right: -80px;
          top: -140px;
        }
        .hero-row {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
        }
        .eyebrow {
          display: inline-block;
          margin: 0 0 10px;
          color: #f5d77d;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 11px;
        }
        .community-hero h2 {
          margin: 0;
          font-size: clamp(2.2rem, 5vw, 3.6rem);
          line-height: 1;
          letter-spacing: -0.06em;
        }
        .hero-subtext {
          margin: 12px 0 0;
          max-width: 650px;
          color: rgba(255,255,255,0.82);
          font-size: 0.94rem;
          line-height: 1.6;
        }
        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 7px 10px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.9);
          font-size: 12px;
          font-weight: 700;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }
        .primary-button,
        .secondary-button,
        .ghost-button,
        .pill-button,
        .tiny-button {
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
        }
        .primary-button,
        .secondary-button,
        .ghost-button,
        .pill-button {
          padding: 10px 16px;
          font-weight: 800;
          font-size: 14px;
        }
        .primary-button {
          background: #fff;
          color: #0b6737;
          box-shadow: 0 8px 16px rgba(11, 103, 55, 0.2);
        }
        .secondary-button {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .ghost-button {
          background: #edf6ef;
          color: #123d29;
        }
        .pill-button {
          background: #f0f5f0;
          color: #1d3125;
          border: 1px solid #e3ebe5;
        }
        .tiny-button {
          background: #ffffff;
          color: #0a5133;
          border: 1px solid #dfeae0;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .primary-button:hover,
        .secondary-button:hover,
        .ghost-button:hover,
        .pill-button:hover,
        .tiny-button:hover {
          transform: translateY(-1px);
        }
        .community-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .stat-card {
          background: linear-gradient(180deg, #ffffff, #f8faf5);
          border: 1px solid #e5eee4;
          border-radius: 20px;
          padding: 18px 16px;
          box-shadow: 0 10px 26px rgba(12, 31, 20, 0.04);
        }
        .stat-card span {
          display: block;
          color: #587165;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .stat-card strong {
          display: block;
          font-size: 1.8rem;
          color: #10271a;
          letter-spacing: -0.05em;
        }
        .community-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px 0 18px;
          border-bottom: 1px solid #edf1ec;
        }
        .community-tabs button {
          border: 1px solid #e6ede7;
          background: #fff;
          color: #3b4c43;
          border-radius: 999px;
          padding: 9px 14px;
          font-weight: 800;
          cursor: pointer;
        }
        .community-tabs button.active {
          background: #0b6737;
          border-color: #0b6737;
          color: #fff;
        }
        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.1fr) minmax(280px, 0.9fr);
          gap: 20px;
        }
        .feed-column,
        .sidebar-column {
          display: grid;
          gap: 18px;
        }
        .panel-card,
        .composer,
        .post-card,
        .member-card,
        .settings-card,
        .rules-card,
        .poll-card,
        .mod-card {
          background: linear-gradient(180deg, #fff, #fbfcfa);
          border: 1px solid #e9efea;
          border-radius: 22px;
          box-shadow: 0 12px 24px rgba(15, 20, 14, 0.04);
        }
        .composer,
        .panel-card,
        .member-card,
        .settings-card,
        .rules-card,
        .poll-card,
        .mod-card,
        .post-card {
          padding: 18px;
        }
        .composer textarea {
          width: 100%;
          min-height: 100px;
          resize: vertical;
          border: 1px solid #ebf0eb;
          border-radius: 16px;
          padding: 14px 16px;
          background: #f8faf8;
          font: inherit;
          color: #1d2f25;
          outline: none;
        }
        .composer textarea:focus {
          border-color: rgba(11, 103, 55, 0.4);
          box-shadow: 0 0 0 3px rgba(11, 103, 55, 0.08);
        }
        .composer-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .post-card {
          display: grid;
          gap: 12px;
          padding: 18px;
        }
        .post-author {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .author-block {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #dff4e7, #dfeefc);
          display: grid;
          place-items: center;
          color: #0b6737;
          font-weight: 900;
        }
        .author-meta strong {
          display: block;
          color: #192b20;
          font-weight: 800;
        }
        .author-meta small {
          display: block;
          color: #5f7266;
          margin-top: 3px;
        }
        .role-badge {
          border-radius: 999px;
          background: #edf8f1;
          color: #195d3e;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 800;
        }
        .post-text {
          color: #334b3c;
          line-height: 1.7;
          margin: 0;
        }
        .post-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #edf1ed;
        }
        .post-actions button {
          background: #f7faf7;
          border: 1px solid #edf0ed;
          color: #355145;
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .comment-box {
          display: grid;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #edf1ed;
        }
        .comment-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .comment-row input {
          flex: 1;
          border: 1px solid #ebf0eb;
          border-radius: 999px;
          padding: 10px 12px;
          background: #fafcfb;
          font: inherit;
          color: #1f2f25;
        }
        .comment-list {
          display: grid;
          gap: 8px;
        }
        .comment-item {
          border: 1px solid #edf0ee;
          background: #fafcfb;
          border-radius: 14px;
          padding: 10px 12px;
        }
        .comment-item strong {
          display: block;
          font-size: 12px;
          color: #1a3127;
        }
        .comment-item p {
          margin: 6px 0 0;
          color: #465d53;
          line-height: 1.5;
        }
        .panel-card h3,
        .member-card h3,
        .settings-card h3,
        .rules-card h3,
        .poll-card h3,
        .mod-card h3 {
          margin: 0 0 14px;
          color: #152b1f;
          font-size: 1.1rem;
        }
        .member-list,
        .rules-list,
        .mini-list {
          display: grid;
          gap: 10px;
        }
        .member-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #edf0ed;
          padding: 10px 12px;
          background: #fff;
          border-radius: 14px;
        }
        .member-main {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .member-main strong {
          display: block;
          color: #1b2b22;
        }
        .member-main span {
          display: block;
          color: #5b6f64;
          font-size: 12px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 9px;
          border-radius: 999px;
          background: #edf8f1;
          color: #1e5a39;
          font-size: 11px;
          font-weight: 800;
        }
        .status-pill.warn {
          background: #fff7da;
          color: #8b5b00;
        }
        .status-pill.alert {
          background: #fde9ea;
          color: #9d1e2a;
        }
        .admin-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .tiny-button.warning {
          background: #fff3ef;
          color: #8e3225;
        }
        .tiny-button.success {
          background: #eaf9f1;
          color: #125c38;
        }
        .rules-list li,
        .mini-list li {
          color: #455d52;
          line-height: 1.7;
        }
        .mini-list {
          margin: 0;
          padding-left: 18px;
        }
        .poll-list {
          display: grid;
          gap: 14px;
        }
        .poll-card h4 {
          margin: 0 0 10px;
          color: #173126;
        }
        .poll-choices {
          display: grid;
          gap: 8px;
        }
        .poll-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid #edf2ee;
          border-radius: 12px;
          background: #fafcfb;
          padding: 10px 12px;
        }
        .poll-option button {
          border: none;
          border-radius: 999px;
          background: #ecf5ef;
          color: #0f5b38;
          padding: 7px 10px;
          font-weight: 800;
          cursor: pointer;
        }
        .settings-grid {
          display: grid;
          gap: 12px;
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 12px;
          border: 1px solid #edf0ee;
          background: #fff;
          border-radius: 14px;
        }
        .setting-row strong {
          display: block;
          color: #193126;
        }
        .setting-row small {
          color: #5b7164;
        }
        .toggle {
          width: 48px;
          height: 28px;
          border-radius: 999px;
          border: none;
          background: #dfe8e1;
          position: relative;
          cursor: pointer;
        }
        .toggle.on {
          background: #0b6737;
        }
        .toggle::after {
          content: "";
          position: absolute;
          top: 4px;
          left: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s ease;
        }
        .toggle.on::after {
          transform: translateX(20px);
        }
        .mod-card ul {
          padding-left: 18px;
          margin: 10px 0 0;
          color: #475d52;
          line-height: 1.8;
        }
        .alert-list {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }
        .alert-item {
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid #edf0ee;
          background: #fafcfb;
        }
        .alert-item strong {
          display: block;
          color: #123327;
          margin-bottom: 4px;
        }
        .alert-item span {
          color: #536a60;
          font-size: 13px;
          line-height: 1.6;
        }
        @media (max-width: 920px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          .community-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hero-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero-actions {
            justify-content: flex-start;
          }
        }
      `}</style>

      <AppShell title={community.name} subtitle={`${community.members.toLocaleString()} members · ${community.online} online · ${community.summary}`}>
        <div className="community-page">
          <section className="community-hero">
            <div className="hero-row">
              <div>
                <p className="eyebrow">Community group</p>
                <h2>{community.name}</h2>
                <p className="hero-subtext">{community.motto} — built for meetings, updates, village coordination, member welfare and trusted community discussions.</p>
                <div className="hero-meta">
                  <span className="hero-pill">{community.region}</span>
                  <span className="hero-pill">Private group</span>
                  <span className="hero-pill">Admin-led</span>
                </div>
              </div>

              <div className="hero-actions">
                <button type="button" className="primary-button" onClick={() => setJoined((value) => !value)}>
                  {joined ? "Joined ✓" : "Join community"}
                </button>
                <button type="button" className="secondary-button">Invite</button>
                <button type="button" className="secondary-button">Share</button>
              </div>
            </div>
          </section>

          <div className="community-stats">
            {communityStats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className="community-tabs">
            {(["Overview", "Posts", "Admins", "Members", "Polls", "Settings"] as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="content-grid">
            <div className="feed-column">
              {activeTab === "Overview" && (
                <>
                  <div className="panel-card">
                    <h3>Community announcement</h3>
                    <p className="post-text">
                      {community.name} is hosting a welfare coordination meeting this week. The village chairman and youth chairman will post updates, review projects, and share opportunities for all members.
                    </p>
                    <div className="composer-actions" style={{ justifyContent: "flex-start", marginTop: "16px" }}>
                      <button type="button" className="ghost-button">View meeting details</button>
                    </div>
                  </div>

                  <div className="panel-card">
                    <h3>Facebook-style group rules</h3>
                    <ul className="mini-list">
                      <li>Respect elders, youth, and every household in the village.</li>
                      <li>Keep updates factual, useful, and relevant to community growth.</li>
                      <li>Do not post harmful, abusive or misleading content.</li>
                      <li>Admins can warn, suspend, or fine members when community standards are violated.</li>
                      <li>Coin fines must be settled before any suspension is lifted.</li>
                    </ul>
                  </div>
                </>
              )}

              {activeTab === "Posts" && (
                <>
                  <div className="composer">
                    <textarea
                      value={announcement}
                      onChange={(event) => setAnnouncement(event.target.value)}
                      placeholder="Share a community update, announcement, or opportunity with the village..."
                    />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setComposerMedia(String(reader.result));
                          setComposerMediaType(file.type.startsWith("video/") ? "video" : "image");
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {composerMedia ? (
                      <div>
                        {composerMediaType === "video" ? (
                          <video src={composerMedia} controls style={{ width: "100%", maxHeight: 260, borderRadius: 16 }} />
                        ) : (
                          <img src={composerMedia} alt="Uploaded media preview" style={{ width: "100%", maxHeight: 260, borderRadius: 16, objectFit: "cover" }} />
                        )}
                      </div>
                    ) : null}
                    <div className="composer-actions">
                      <button type="button" className="pill-button" onClick={() => { setAnnouncement(""); setComposerMedia(null); setComposerMediaType(""); }}>Clear</button>
                      <button type="button" className="primary-button" onClick={handlePublishPost}>Post update</button>
                    </div>
                  </div>

                  {sortedPosts.map((post) => (
                    <article key={post.id} className="post-card">
                      <div className="post-author">
                        <div className="author-block">
                          <div className="avatar">{post.author.slice(0, 1).toUpperCase()}</div>
                          <div className="author-meta">
                            <strong>{post.author}</strong>
                            <small>{post.time}</small>
                          </div>
                        </div>
                        <span className="role-badge">{post.role}</span>
                      </div>

                      <p className="post-text">{post.text}</p>

                      <div className="post-actions">
                        <button type="button" onClick={() => handleLike(post.id)}>👍 Like · {post.likes}</button>
                        <button type="button" onClick={() => handleShare(post.id)}>↗ Share · {post.shares}</button>
                        <button type="button" onClick={() => handleReport("post", post.id)}>⚑ Report</button>
                      </div>

                      <div className="comment-box">
                        <div className="comment-row">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                handleAddComment(post.id, (event.target as HTMLInputElement).value);
                                (event.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                          <button type="button" className="tiny-button" onClick={(event) => {
                            const input = (event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null);
                            if (input) {
                              handleAddComment(post.id, input.value);
                              input.value = "";
                            }
                          }}>Comment</button>
                        </div>

                        <div className="comment-list">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="comment-item">
                              <strong>{comment.author} · {comment.time}</strong>
                              <p>{comment.text}</p>
                              <div className="post-actions" style={{ borderTop: "none", paddingTop: 0 }}>
                                <button type="button">👍 {comment.likes}</button>
                                <button type="button" onClick={() => handleReport("comment", post.id, comment.id)}>⚑ Report</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </>
              )}

              {activeTab === "Admins" && (
                <div className="member-card">
                  <h3>Community admins</h3>
                  <div className="member-list">
                    {community.reservedPositions.map((position) => (
                      <div key={position.title} className="member-item">
                        <div className="member-main">
                          <div className="avatar">{position.title.slice(0, 1).toUpperCase()}</div>
                          <div>
                            <strong>{position.title}</strong>
                            <span>{position.description}</span>
                          </div>
                        </div>
                        <span className={position.admin ? "status-pill" : "status-pill warn"}>{position.admin ? "Admin" : "Member"}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <Link href="/communities/admins" className="text-link">Open full community admin roster</Link>
                  </div>
                </div>
              )}

              {activeTab === "Members" && (
                <div className="member-card">
                  <h3>Members</h3>
                  {memberNotice ? <div className="notice" style={{ marginBottom: 12 }}>{memberNotice}</div> : null}
                  <div className="member-list">
                    {community.membersList.map((member) => (
                      <div key={member.id} className="member-item">
                        <div className="member-main">
                          <div className="avatar">{member.name.slice(0, 1).toUpperCase()}</div>
                          <div>
                            <strong>{member.name}</strong>
                            <span>{member.role}</span>
                          </div>
                        </div>
                        <div className="admin-tools">
                          <span className={member.status.includes("Suspended") ? "status-pill alert" : member.isAdmin ? "status-pill" : "status-pill warn"}>{member.status}</span>
                          <button type="button" className="tiny-button" onClick={() => handleMemberAction("friend", member.name)}>Add friend</button>
                          <button type="button" className="tiny-button" onClick={() => handleMemberAction("message", member.name)}>Message</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Polls" && (
                <div className="poll-list">
                  {community.polls.map((poll) => (
                    <div key={poll.id} id={`poll-${poll.id}`} className="poll-card">
                      <h3>{poll.question}</h3>
                      <h4>{poll.ends}</h4>
                      <div className="poll-choices">
                        {poll.options.map((option) => (
                          <div key={option.id} className="poll-option">
                            <span>{option.label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <strong>{option.votes}</strong>
                              <button type="button" onClick={() => handleVote(poll.id, option.id)}>Vote</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "Settings" && (
                <div className="settings-grid">
                  <div className="settings-card">
                    <h3>Community settings</h3>
                    <div className="setting-row">
                      <div>
                        <strong>Allow members to post</strong>
                        <small>Default social posting and updates</small>
                      </div>
                      <button type="button" className={`toggle ${settings.allowPosting ? "on" : ""}`} onClick={() => toggleSetting("allowPosting")} aria-label="toggle allow posting" />
                    </div>
                    <div className="setting-row">
                      <div>
                        <strong>Auto moderation</strong>
                        <small>Hidden reports and review queue</small>
                      </div>
                      <button type="button" className={`toggle ${settings.autoReportHandling ? "on" : ""}`} onClick={() => toggleSetting("autoReportHandling")} aria-label="toggle auto moderation" />
                    </div>
                    <div className="setting-row">
                      <div>
                        <strong>Share lock</strong>
                        <small>Restrict posting and external sharing</small>
                      </div>
                      <button type="button" className={`toggle ${settings.shareLocked ? "on" : ""}`} onClick={() => toggleSetting("shareLocked")} aria-label="toggle share lock" />
                    </div>
                    <div className="setting-row">
                      <div>
                        <strong>Only admins can announce</strong>
                        <small>Keep official updates authoritative</small>
                      </div>
                      <button type="button" className={`toggle ${settings.adminOnlyAnnouncements ? "on" : ""}`} onClick={() => toggleSetting("adminOnlyAnnouncements")} aria-label="toggle admin announcements" />
                    </div>
                  </div>

                  <div className="mod-card">
                    <h3>ItukuApp moderation bolts</h3>
                    <ul>
                      <li>Auto-hide reported comments after a threshold is reached.</li>
                      <li>Lock community share or posting when repeated reports are filed.</li>
                      <li>Flag abusive posts for admin review and temporary restriction.</li>
                      <li>Apply coin penalties automatically before a suspension is cleared.</li>
                      <li>Queue suspicious content for admin review while preserving evidence.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <aside className="sidebar-column">
              <div className="panel-card">
                <h3>Community access</h3>
                <div className="admin-tools">
                  <button type="button" className="tiny-button success">Invite</button>
                  <button type="button" className="tiny-button">Create event</button>
                  <button type="button" className="tiny-button">Share update</button>
                </div>
              </div>

              <div className="rules-card">
                <h3>Group roles & governance</h3>
                <ul className="rules-list">
                  {community.reservedPositions.map((position) => (
                    <li key={position.title}>
                      <strong>{position.title}</strong> — {position.description}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="member-card">
                <h3>Admin actions</h3>
                <div className="admin-tools">
                  <button type="button" className="tiny-button success">Suspend</button>
                  <button type="button" className="tiny-button warning">Fine 25 coin</button>
                  <button type="button" className="tiny-button">Promote member</button>
                </div>
              </div>

              <div className="panel-card">
                <h3>Moderation alerts</h3>
                <div className="alert-list">
                  {reportAlerts.map((alert) => (
                    <div key={alert.id} className="alert-item">
                      <strong>{alert.title}</strong>
                      <span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </AppShell>
    </>
  );
}
