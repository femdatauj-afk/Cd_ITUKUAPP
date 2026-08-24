"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { CommentThread } from "../../components/comment-thread";
import { ItukuCoinAmount } from "../../components/ituku-coin";
import coverImage from "../../../ITUKUAPP HOMEPAGE.png";
import { fetchUserProfile, followUser, getSeededUsers, sendPrivateMessage, unfollowUser } from "../../lib/api";

type UserProfile = {
  id: string;
  fullName: string;
  username: string;
  village: string;
  email: string;
  phone: string;
  bio: string;
  walletBalance: number;
  posts: number;
  groups: number;
  followers: number;
  following: number;
  isVerified: boolean;
  verifiedBadge?: string;
  avatar: string;
  role: string;
  isFollowing?: boolean;
  postsData: Array<{ id: string; content: string; photo?: string | null; createdAt: string; _count?: { comments: number; likes: number; shares: number } }>;
};

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchUserProfile(username)
      .then((user) => {
        if (!active) return;
        const avatarText = (user.fullName || user.username || "IT").split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase();
        const stats = user.stats || {};
        setProfile({ id: user.id, fullName: user.fullName, username: user.username, village: user.village, email: user.email || "", phone: user.phone || "", bio: user.bio || "No bio yet.", walletBalance: user.wallet?.balance || 0, posts: stats.postsCount || 0, groups: stats.friendsCount || 0, followers: stats.followersCount || 0, following: stats.followingCount || 0, isVerified: user.isVerified || false, verifiedBadge: user.verifiedBadge, avatar: avatarText, role: user.role || "member", isFollowing: user.isFollowing, postsData: user.posts || [] });
        setIsFollowing(Boolean(user.isFollowing));
      })
      .catch(() => {
        const user = getSeededUsers().find((item) => item.username === username);
        if (user && active) {
          const avatarText = user.fullName.split(" ").map((part: string) => part[0]).slice(0, 2).join("").toUpperCase();
          setProfile({ id: user.id, fullName: user.fullName, username: user.username, village: user.village, email: user.email, phone: user.phone, bio: user.bio, walletBalance: user.walletBalance || 0, posts: 0, groups: 0, followers: 0, following: 0, isVerified: user.isVerified || false, verifiedBadge: user.verifiedBadge, avatar: avatarText, role: user.role, postsData: [] });
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);

  const handleFollow = async () => {
    if (!profile) return;
    setActionMessage("");
    try {
      if (isFollowing) {
        await unfollowUser(profile.id);
        setIsFollowing(false);
        setProfile((current) => current ? { ...current, followers: Math.max(0, current.followers - 1) } : current);
      } else {
        await followUser(profile.id);
        setIsFollowing(true);
        setProfile((current) => current ? { ...current, followers: current.followers + 1 } : current);
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Sign in to follow this user.");
    }
  };

  const handleSendMessage = async () => {
    if (!profile || !messageDraft.trim()) return;
    setMessageSending(true);
    try {
      await sendPrivateMessage(profile.id, messageDraft.trim());
      setMessageDraft("");
      setMessageOpen(false);
      setActionMessage("Message sent.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Sign in to message this user.");
    } finally {
      setMessageSending(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Profile" subtitle="Loading...">
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Loading profile...</p>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell title="Profile" subtitle="Not found">
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>User not found</p>
          <Link href="/feed" style={{ color: "var(--primary-color)" }}>
            Back to Feed
          </Link>
        </div>
      </AppShell>
    );
  }

  const tabs = ["Posts", "About", "Friends", "Photos", "Videos", "Groups", "Pages", "More"];

  return (
    <AppShell title={profile.fullName} subtitle={`@${profile.username}`}>
      <div className="profile-container">
        {/* Cover Photo */}
        <div className="profile-cover">
          <Image
            src={coverImage}
            alt="Profile Cover"
            fill
            sizes="(max-width: 700px) 100vw, 900px"
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar large">
              <span>{profile.avatar}</span>
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <h1>{profile.fullName}</h1>
                {profile.isVerified && (
                  <span className="verified-badge" title={profile.verifiedBadge}>
                    ✓
                  </span>
                )}
              </div>
              <p className="profile-username">@{profile.username}</p>
              <p className="profile-village">{profile.village} · {profile.role}</p>
              <p className="profile-bio">{profile.bio}</p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat">
              <strong>{profile.posts}</strong>
              <small>Posts</small>
            </div>
            <div className="stat">
              <strong>{profile.followers}</strong>
              <small>Followers</small>
            </div>
            <div className="stat">
              <strong>{profile.following}</strong>
              <small>Following</small>
            </div>
            <div className="stat">
              <strong>{profile.groups}</strong>
              <small>Groups</small>
            </div>
          </div>

          <div className="profile-actions">
            <button className="action-button primary" type="button" onClick={handleFollow}>{isFollowing ? "Following" : "Follow"}</button>
            <button className="action-button" type="button" onClick={() => setMessageOpen(true)}>Message</button>
            <div className="more-wrap">
              <button className="action-button subtle" type="button" onClick={() => setMoreOpen((current) => !current)}>More</button>
              {moreOpen && <div className="more-menu"><button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy profile link</button><button type="button" onClick={() => setActionMessage("Profile reporting is available to signed-in members.")}>Report profile</button></div>}
            </div>
          </div>
          {actionMessage && <p className="profile-action-message">{actionMessage}</p>}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={tab === "Posts" ? `/profile/${profile.username}` : `/profile/${profile.username}/${tab.toLowerCase()}`}
              className={activeTab === tab ? "tab active" : "tab"}
            >
              {tab}
            </Link>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {activeTab === "Posts" && (
            <div className="profile-posts">
              <div className="profile-intro-card"><p className="eyebrow">INTRO</p><p>{profile.bio}</p><p><strong>{profile.village}</strong> community · Joined on ItukuApp</p><p><ItukuCoinAmount amount={profile.walletBalance} /> current balance</p></div>
              {profile.postsData.length ? profile.postsData.map((post) => <article className="profile-post" key={post.id}><div className="profile-post-heading"><strong>{profile.fullName}{profile.isVerified ? <span className="verified-badge" title={profile.verifiedBadge}>✓</span> : null}</strong><small>@{profile.username} · {new Date(post.createdAt).toLocaleString()}</small></div><p>{post.content}</p>{post.photo ? (/(mp4|webm)(\?|$)/i.test(post.photo) ? <video controls src={post.photo} /> : <img src={post.photo} alt="Profile post media" />) : null}<CommentThread postId={post.id} /></article>) : <div className="empty-state"><p>No posts yet</p></div>}
            </div>
          )}
          {activeTab === "Photos" && (
            <div className="empty-state">
              <p>No photos yet</p>
            </div>
          )}
          {activeTab === "Groups" && (
            <div className="empty-state">
              <p>No groups yet</p>
            </div>
          )}
          {activeTab === "Friends" && <div className="empty-state"><p>Friends are visible according to this user's privacy settings.</p></div>}
          {activeTab === "Videos" && <div className="empty-state"><p>No videos yet</p></div>}
          {activeTab === "Pages" && <div className="empty-state"><p>No pages yet</p></div>}
          {activeTab === "More" && <div className="empty-state"><p>More profile activity will appear here.</p></div>}
          {activeTab === "About" && (
            <div className="about-section">
              <div className="about-item">
                <strong>Role:</strong>
                <span>{profile.role}</span>
              </div>
              <div className="about-item">
                <strong>Email:</strong>
                <span>{profile.email}</span>
              </div>
              <div className="about-item">
                <strong>Phone:</strong>
                <span>{profile.phone}</span>
              </div>
              <div className="about-item">
                <strong>Village:</strong>
                <span>{profile.village}</span>
              </div>
              <div className="about-item">
                <strong>Wallet Balance:</strong>
                <span>{profile.walletBalance.toLocaleString()} coins</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {messageOpen && <div className="message-overlay" role="dialog" aria-modal="true" aria-label={`Message ${profile.fullName}`}><div className="message-dialog"><button className="close-dialog" type="button" onClick={() => setMessageOpen(false)} aria-label="Close">×</button><p className="eyebrow">PRIVATE MESSAGE</p><h2>Message {profile.fullName}</h2><textarea value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Write a respectful message..." rows={5} /><button className="send-message" type="button" onClick={handleSendMessage} disabled={messageSending || !messageDraft.trim()}>{messageSending ? "Sending..." : "Send message"}</button></div></div>}

      <style jsx>{`
        .profile-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .profile-cover {
          position: relative;
          width: 100%;
          height: 250px;
          background: #e0e0e0;
        }

        .profile-header {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .profile-avatar-section {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          flex-shrink: 0;
          border: 4px solid white;
          margin-top: -60px;
        }

        .profile-avatar.large {
          width: 120px;
          height: 120px;
        }

        .profile-info {
          flex: 1;
          padding-top: 10px;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .profile-name-row h1 {
          margin: 0;
          font-size: 28px;
          color: #000;
        }

        .verified-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #4267b2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .profile-username {
          margin: 0 0 4px 0;
          color: #65676b;
          font-size: 14px;
        }

        .profile-village {
          margin: 0 0 8px 0;
          color: #65676b;
          font-size: 13px;
        }

        .profile-bio {
          margin: 0;
          color: #000;
          font-size: 14px;
          line-height: 1.5;
        }

        .profile-stats {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .stat {
          text-align: center;
        }

        .stat strong {
          display: block;
          font-size: 20px;
          color: #000;
          margin-bottom: 4px;
        }

        .stat small {
          display: block;
          font-size: 12px;
          color: #65676b;
        }

        .profile-actions {
          display: flex;
          gap: 10px;
        }

        .more-wrap { position: relative; flex: 1; }
        .more-wrap .action-button { width: 100%; }
        .more-menu { position: absolute; right: 0; top: calc(100% + 8px); z-index: 4; min-width: 190px; padding: 8px; border: 1px solid #e1eae0; border-radius: 12px; background: #fff; box-shadow: 0 14px 30px rgba(17,54,33,.14); }
        .more-menu button { display: block; width: 100%; border: 0; border-radius: 8px; background: transparent; padding: 10px; text-align: left; cursor: pointer; }
        .more-menu button:hover { background: #f3f8f1; }
        .profile-action-message { margin: 12px 0 0; color: #0b6737; font-weight: 700; font-size: 13px; }
        .message-overlay { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 20px; background: rgba(12,29,19,.44); }
        .message-dialog { position: relative; width: min(100%, 480px); padding: 28px; border-radius: 20px; background: #fff; box-shadow: 0 24px 60px rgba(0,0,0,.2); }
        .message-dialog h2 { margin: 0 0 18px; color: #17251b; }
        .message-dialog textarea { width: 100%; resize: vertical; border: 1px solid #dbe7db; border-radius: 12px; padding: 12px; outline: none; }
        .send-message { width: 100%; margin-top: 12px; border: 0; border-radius: 999px; padding: 12px; background: #0b6737; color: #fff; font-weight: 700; cursor: pointer; }
        .send-message:disabled { opacity: .5; cursor: not-allowed; }
        .close-dialog { position: absolute; top: 12px; right: 14px; border: 0; background: transparent; color: #657166; font-size: 24px; cursor: pointer; }

        .action-button {
          flex: 1;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button.primary {
          background: #0a66c2;
          color: white;
        }

        .action-button.primary:hover {
          background: #084399;
        }

        .action-button {
          background: #e4e6eb;
          color: #000;
        }

        .action-button:hover {
          background: #ccc;
        }

        .action-button.subtle {
          background: transparent;
          border: 1px solid #ccc;
        }

        .profile-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          background: white;
        }

        .tab {
          flex: 1;
          padding: 12px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #65676b;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab.active {
          color: #0a66c2;
          border-bottom-color: #0a66c2;
        }

        .tab:hover {
          color: #000;
        }

        .profile-content {
          padding: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #65676b;
        }

        .about-section {
          display: grid;
          gap: 16px;
        }

        .about-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .about-item strong {
          color: #000;
          font-weight: 600;
        }

        .about-item span {
          color: #65676b;
        }

        @media (max-width: 600px) {
          .profile-cover {
            height: 150px;
          }

          .profile-avatar-section {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .profile-stats {
            flex-wrap: wrap;
            gap: 20px;
          }

          .profile-name-row h1 {
            font-size: 24px;
          }

          .profile-tabs {
            flex-wrap: wrap;
          }

          .tab {
            flex: auto;
          }
        }
      `}</style>
    </AppShell>
  );
}
