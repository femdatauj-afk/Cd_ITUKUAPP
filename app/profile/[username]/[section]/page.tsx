"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "../../../components/app-shell";
import { fetchCommunityUsers, fetchUserProfile, getSeededUsers } from "../../../lib/api";

type ProfileSummary = {
  id: string;
  fullName: string;
  username: string;
  village: string;
  email?: string;
  phone?: string;
  bio?: string;
  role?: string;
  posts?: Array<{ id: string; content: string; photo?: string | null; createdAt: string }>;
  stats?: { friendsCount?: number; followersCount?: number; followingCount?: number };
};

const labels: Record<string, string> = {
  about: "About",
  friends: "Friends",
  photos: "Photos",
  videos: "Videos",
  groups: "Groups",
  pages: "Pages",
  more: "More activity",
};

export default function ProfileSectionPage() {
  const params = useParams();
  const username = String(params.username);
  const section = String(params.section).toLowerCase();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [friends, setFriends] = useState<Array<{ id: string; fullName: string; username: string; village: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchUserProfile(username),
      section === "friends" ? fetchCommunityUsers() : Promise.resolve([]),
    ]).then(([user, people]) => {
      if (!active) return;
      setProfile(user as ProfileSummary);
      setFriends((people as Array<Record<string, any>>).filter((person) => person.username !== username).slice(0, 8).map((person) => ({ id: person.id, fullName: person.fullName, username: person.username, village: person.village })));
    }).catch(() => {
      const user = getSeededUsers().find((item) => item.username === username);
      if (active && user) setProfile(user as ProfileSummary);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section, username]);

  if (loading) return <AppShell title="Profile" subtitle="Loading section..."><div className="profile-section-state">Loading profile details...</div></AppShell>;
  if (!profile) return <AppShell title="Profile" subtitle="Not found"><div className="profile-section-state"><p>User not found.</p><Link href="/friends">Browse community members</Link></div></AppShell>;

  const title = labels[section] || "Profile section";
  const posts = profile.posts || [];
  const mediaPosts = posts.filter((post) => post.photo);

  return (
    <AppShell title={`${profile.fullName} · ${title}`} subtitle={`@${profile.username} · ${profile.village}`}>
      <section className="profile-section-page">
        <nav className="profile-section-nav" aria-label="Profile sections">
          <Link href={`/profile/${profile.username}`}>Posts</Link>
          {Object.entries(labels).map(([key, label]) => <Link className={key === section ? "active" : ""} href={`/profile/${profile.username}/${key}`} key={key}>{label}</Link>)}
        </nav>

        {section === "about" ? <div className="profile-detail-grid"><div><span>Bio</span><strong>{profile.bio || "No bio yet."}</strong></div><div><span>Village</span><strong>{profile.village}</strong></div><div><span>Role</span><strong>{profile.role || "Member"}</strong></div><div><span>Followers</span><strong>{profile.stats?.followersCount || 0}</strong></div><div><span>Following</span><strong>{profile.stats?.followingCount || 0}</strong></div></div> : null}
        {section === "friends" ? <div className="profile-member-grid">{friends.length ? friends.map((friend) => <Link className="profile-member-card" href={`/profile/${friend.username}`} key={friend.id}><span>{friend.fullName.slice(0, 2).toUpperCase()}</span><strong>{friend.fullName}</strong><small>@{friend.username} · {friend.village}</small></Link>) : <div className="profile-section-state">Friends are visible according to this user's privacy settings.</div>}</div> : null}
        {(section === "photos" || section === "videos") ? <div className="profile-media-grid">{mediaPosts.filter((post) => section === "photos" ? !/(mp4|webm)(\?|$)/i.test(post.photo || "") : /(mp4|webm)(\?|$)/i.test(post.photo || "")).map((post) => section === "videos" ? <video controls src={post.photo || undefined} key={post.id} /> : <img src={post.photo || undefined} alt="Profile media" key={post.id} />)}{mediaPosts.length === 0 ? <div className="profile-section-state">No {section} yet.</div> : null}</div> : null}
        {(section === "groups" || section === "pages" || section === "more") ? <div className="profile-section-state"><h2>{title}</h2><p>{section === "groups" ? `${profile.fullName} has not added public groups yet.` : section === "pages" ? "No public pages are connected to this profile yet." : "More profile activity will appear here as it becomes available."}</p></div> : null}
      </section>
      <style jsx>{`
        .profile-section-page { display: grid; gap: 18px; }
        .profile-section-nav { display: flex; gap: 8px; flex-wrap: wrap; padding: 8px; border: 1px solid #e3ebdf; border-radius: 16px; background: #fff; }
        .profile-section-nav a { padding: 9px 13px; border-radius: 10px; color: #45604b; font-size: 13px; font-weight: 700; }
        .profile-section-nav a:hover, .profile-section-nav a.active { background: #edf7ef; color: #0d6738; }
        .profile-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid #e3ebdf; border-radius: 18px; background: #e3ebdf; }
        .profile-detail-grid div { display: grid; gap: 7px; padding: 18px; background: #fff; }
        .profile-detail-grid span, .profile-member-card small { color: #68766c; font-size: 12px; }
        .profile-member-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
        .profile-member-card { display: grid; gap: 5px; padding: 16px; border: 1px solid #e3ebdf; border-radius: 16px; background: #fff; color: #203326; }
        .profile-member-card > span { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; background: #dff0e2; color: #0d6738; font-weight: 800; }
        .profile-media-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .profile-media-grid img, .profile-media-grid video { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 14px; background: #eef4ef; }
        .profile-section-state { padding: 34px; border: 1px solid #e3ebdf; border-radius: 18px; background: #fff; color: #536257; text-align: center; }
        .profile-section-state h2 { margin: 0 0 8px; color: #203326; }
        .profile-section-state a { color: #0d6738; font-weight: 700; }
        @media (max-width: 650px) { .profile-detail-grid, .profile-media-grid { grid-template-columns: 1fr 1fr; } .profile-detail-grid div { padding: 14px; } }
      `}</style>
    </AppShell>
  );
}
