"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../components/app-shell";
import { ItukuCoinAmount } from "../components/ituku-coin";
import coverImage from "../../ITUKUAPP HOMEPAGE.png";
import avatarImage from "../../HENRY-OF-ITUKU PICTURE.jpeg";
import {
  clearSession,
  createPost,
  fetchWalletBalance,
  fetchUserFollowers,
  fetchUserFollowing,
  getCoverPhoto,
  getProfilePhoto,
  getProfileSettings,
  getSession,
  saveCoverPhoto,
  saveProfilePhoto,
  saveProfileSettings,
  saveSession,
  uploadFile,
  updateProfile,
} from "../lib/api";

const profileInitial = {
  fullName: "Chinedu Henry Ujam",
  username: "Henry-Of-Ituku",
  village: "Umukulu",
  email: "henry4683328@gmail.com",
  phone: "08142229477",
  bio: "Verified founder and lead developer of ItukuApp. Building a stronger, more connected Ituku community through technology and trust.",
  walletBalance: 1000000,
  posts: 48,
  groups: 12,
  followers: 356,
  following: 198,
  isVerified: true,
  verifiedBadge: "ItukuApp Verified",
};

const tabs = ["Posts", "Photos", "Groups", "About"];

const defaultNotificationState = getProfileSettings().notifications;

const notificationEntries = [
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "newFollowers", label: "New Followers" },
  { key: "mentions", label: "Mentions" },
  { key: "messages", label: "Messages" },
  { key: "groupActivity", label: "Group Activity" },
  { key: "pageActivity", label: "Page Activity" },
  { key: "communityAnnouncements", label: "Community Announcements" },
  { key: "events", label: "Events" },
  { key: "coinTransactions", label: "Coin Transactions" },
] as const;

const initialPosts = [
  {
    id: "clean-up",
    title: "Community clean-up drive",
    text: "We are coming together this Saturday to clean the market square and support the youth volunteer team. Every hand counts.",
    reactions: { likes: 124, comments: 18, shares: 7 },
  },
  {
    id: "market-update",
    title: "Village market update",
    text: "New traders and local businesses are joining the digital platform. Let’s support each other and grow together.",
    reactions: { likes: 86, comments: 12, shares: 4 },
  },
];

const settingsSections = [
  {
    id: "account",
    label: "Account",
    items: [
      "Personal Information",
      "Password & Security",
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    items: ["Privacy", "Blocked Accounts"],
  },
  {
    id: "notifications",
    label: "Notifications",
    items: ["Notifications"],
  },
  {
    id: "appearance",
    label: "Appearance",
    items: ["Appearance", "Language"],
  },
  {
    id: "community",
    label: "Community",
    items: ["My Groups", "My Pages"],
  },
  {
    id: "wallet",
    label: "Wallet",
    items: ["Coins & Wallet", "Transactions"],
  },
  {
    id: "support",
    label: "Support",
    items: ["Help & Support", "Report a Problem"],
  },
  {
    id: "legal",
    label: "Legal",
    items: ["Terms", "Privacy Policy"],
  },
  {
    id: "about",
    label: "About",
    items: ["About ItukuApp"],
  },
];

const blockedAccounts = ["John Doe", "Amaka", "Chinedu"];

const privacyChoices = ["Everyone", "Friends/Followers", "Only Me"];

const loginActivity = [
  { name: "Android Phone", location: "Lagos, Nigeria", status: "Active now" },
  { name: "Windows PC", location: "Last active 2 hours ago", status: "Online" },
];

const notifications = [
  "Likes",
  "Comments",
  "New Followers",
  "Mentions",
  "Messages",
  "Group Activity",
  "Page Activity",
  "Community Announcements",
  "Events",
  "Coin Transactions",
];

const pages = [
  { name: "Ituku Business Hub", followers: "1,240 Followers" },
  { name: "Ituku Youth Association", followers: "842 Followers" },
];

const savedItems = ["All", "Posts", "Videos", "Photos", "Events"];

const languageOptions = ["English", "Igbo", "Pidgin", "Hausa", "Yoruba"];

const postCards = [
  {
    title: "Community clean-up drive",
    text: "We are coming together this Saturday to clean the market square and support the youth volunteer team. Every hand counts.",
    meta: "2 hours ago · 124 reactions",
  },
  {
    title: "Village market update",
    text: "New traders and local businesses are joining the digital platform. Let’s support each other and grow together.",
    meta: "Yesterday · 86 reactions",
  },
];

const photoGrid = ["A", "B", "C", "D", "E", "F"];

const groupItems = [
  { name: "Umukulu Youth Circle", members: "2.4k members" },
  { name: "Community Business Forum", members: "1.1k members" },
  { name: "Village Women Network", members: "903 members" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Posts");
  const [settingsSection, setSettingsSection] = useState("account");
  const [profile, setProfile] = useState(profileInitial);
  const [editingProfile, setEditingProfile] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveState, setSaveState] = useState<{ loading: boolean; message: string }>({ loading: false, message: "" });
  const [form, setForm] = useState({
    fullName: profileInitial.fullName,
    username: profileInitial.username,
    email: profileInitial.email,
    phone: profileInitial.phone,
    village: profileInitial.village,
    bio: profileInitial.bio,
  });
  const [privacy, setPrivacy] = useState(() => getProfileSettings().privacy);
  const [notificationState, setNotificationState] = useState<Record<string, boolean>>(() => getProfileSettings().notifications);
  const [selectedLanguage, setSelectedLanguage] = useState(() => getProfileSettings().appearance.language);
  const [theme, setTheme] = useState(() => getProfileSettings().appearance.theme);
  const [textSize, setTextSize] = useState(() => getProfileSettings().appearance.textSize);
  const [reduceAnimations, setReduceAnimations] = useState(() => getProfileSettings().appearance.reduceAnimations);
  const [postCards, setPostCards] = useState(initialPosts);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(getProfilePhoto());
  const [coverPreview, setCoverPreview] = useState<string | null>(getCoverPhoto());
  const [liveLocation, setLiveLocation] = useState("Location not shared");
  const [postDraft, setPostDraft] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [publishingPost, setPublishingPost] = useState(false);
  const [postNotice, setPostNotice] = useState("");
  const [connectionsOpen, setConnectionsOpen] = useState<"followers" | "following" | null>(null);
  const [connections, setConnections] = useState<Array<{ id: string; username: string; fullName: string; profilePhoto?: string | null; bio?: string | null; isFollowedBack?: boolean }>>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWalletBalance().then(({ balance }) => setProfile((current) => ({ ...current, walletBalance: balance }))).catch(() => undefined);
  }, []);

  useEffect(() => {
    saveProfileSettings({
      privacy,
      notifications: notificationState,
      appearance: {
        theme,
        textSize,
        reduceAnimations,
        language: selectedLanguage,
      },
    });
  }, [privacy, notificationState, theme, textSize, reduceAnimations, selectedLanguage]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLiveLocation("Location not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = coords.latitude.toFixed(4);
        const longitude = coords.longitude.toFixed(4);
        setLiveLocation(`Live location · ${latitude}, ${longitude}`);
      },
      () => {
        setLiveLocation("Location not shared");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  const selectedSettings = settingsSections.find((item) => item.id === settingsSection) ?? settingsSections[0];

  const updateForm = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openConnections = async (type: "followers" | "following") => {
    setConnectionsOpen(type);
    setConnectionsLoading(true);
    setConnectionsError("");
    try {
      const people = type === "followers" ? await fetchUserFollowers(String(getSession()?.user?.id || "")) : await fetchUserFollowing(String(getSession()?.user?.id || ""));
      setConnections(people);
    } catch (error) {
      setConnections([]);
      setConnectionsError(error instanceof Error ? error.message : `Unable to load ${type}.`);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const selectPostFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPostFile(file);
    setPostPreview(URL.createObjectURL(file));
  };

  const publishPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!postDraft.trim() && !postFile) return;
    setPublishingPost(true);
    setPostNotice("");
    const content = postDraft.trim() || "Shared a photo with the Ituku community.";
    try {
      const mediaUrl = postFile ? (await uploadFile(postFile, "posts")).data.url : undefined;
      const created = await createPost(content, mediaUrl);
      setPostCards((current) => [{ id: created.id, title: "New post", text: content, reactions: { likes: 0, comments: 0, shares: 0 } }, ...current]);
      setPostNotice("Published successfully.");
    } catch (error) {
      setPostCards((current) => [{ id: `local-post-${Date.now()}`, title: "New post", text: content, reactions: { likes: 0, comments: 0, shares: 0 } }, ...current]);
      setPostNotice(error instanceof Error ? `${error.message} Saved locally.` : "Saved locally. Sign in to publish to the community.");
    } finally {
      setPostDraft("");
      setPostFile(null);
      setPostPreview(null);
      setPublishingPost(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setLogoutOpen(false);
    window.location.assign("/auth/login");
  };

  const handleDelete = () => {
    clearSession();
    setDeleteOpen(false);
    window.location.assign("/");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "cover") => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : null;
      if (target === "avatar") {
        setAvatarPreview(nextValue);
        saveProfilePhoto(nextValue);
      } else {
        setCoverPreview(nextValue);
        saveCoverPhoto(nextValue);
      }
      setPhotoSheetOpen(false);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const saveProfile = async () => {
    const session = getSession();
    setSaveState({ loading: true, message: "" });

    try {
      const updated = await updateProfile({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        village: form.village,
        bio: form.bio,
      });

      setProfile((current) => ({
        ...current,
        fullName: updated.fullName ?? form.fullName,
        username: updated.username ?? form.username,
        email: updated.email ?? form.email,
        phone: updated.phone ?? form.phone,
        village: updated.village ?? form.village,
        bio: updated.bio ?? form.bio,
      }));

      if (session?.token) {
        saveSession({ token: session.token, user: updated });
      }

      setEditingProfile(false);
      setSaveState({ loading: false, message: "Profile saved successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save profile changes.";
      setSaveState({ loading: false, message });
    }
  };

  const renderTabContent = () => {
    if (activeTab === "Posts") {
      return (
        <div className="post-list">
          <form className="profile-composer" onSubmit={publishPost}>
            <div className="story-head"><div className="story-avatar">{profile.fullName.slice(0, 2).toUpperCase()}</div><div><strong>Share with your community</strong><small>Post an update from your profile</small></div></div>
            <textarea value={postDraft} onChange={(event) => setPostDraft(event.target.value)} placeholder={`What is happening in ${profile.village}?`} rows={3} />
            {postPreview ? <img className="composer-preview" src={postPreview} alt="Selected post media preview" /> : null}
            <div className="composer-actions"><label className="button-secondary" htmlFor="profile-post-media">Add photo or video</label><input id="profile-post-media" type="file" accept="image/*,video/*" onChange={selectPostFile} /><button className="button" type="submit" disabled={publishingPost || (!postDraft.trim() && !postFile)}>{publishingPost ? "Publishing..." : "Publish"}</button></div>
            {postNotice ? <p className="profile-save-message" role="status">{postNotice}</p> : null}
          </form>
          {postCards.map((post) => (
            <article key={post.id} className="story-card">
              <div className="story-head">
                <div className="story-avatar">CU</div>
                <div>
                  <strong>{profile.fullName}</strong>
                  <small>{post.title}</small>
                </div>
              </div>
              <h3>{post.title}</h3>
              <p>{post.text}</p>
              <div className="story-actions">
                <button type="button" onClick={() => setPostCards((current) => current.map((item) => item.id === post.id ? { ...item, reactions: { ...item.reactions, likes: item.reactions.likes + 1 } } : item))}>❤ {post.reactions.likes}</button>
                <button type="button" onClick={() => setPostCards((current) => current.map((item) => item.id === post.id ? { ...item, reactions: { ...item.reactions, comments: item.reactions.comments + 1 } } : item))}>💬 {post.reactions.comments}</button>
                <button type="button" onClick={() => setPostCards((current) => current.map((item) => item.id === post.id ? { ...item, reactions: { ...item.reactions, shares: item.reactions.shares + 1 } } : item))}>↻ {post.reactions.shares}</button>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (activeTab === "Photos") {
      return (
        <div className="photo-grid">
          {photoGrid.map((photo, index) => (
            <div key={photo + index} className="photo-tile">
              <span>{photo}</span>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "Groups") {
      return (
        <div className="resource-list">
          {groupItems.map((group) => (
            <div key={group.name} className="resource-item">
              <div className="resource-badge">#{group.name.slice(0, 1)}</div>
              <div>
                <strong>{group.name}</strong>
                <small>{group.members}</small>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="about-panel">
        <div className="info-row">
          <span>Name</span>
          <strong>{profile.fullName}</strong>
        </div>
        <div className="info-row">
          <span>Username</span>
          <strong>@{profile.username}</strong>
        </div>
        <div className="info-row">
          <span>Email</span>
          <strong>{profile.email}</strong>
        </div>
        <div className="info-row">
          <span>Phone</span>
          <strong>{profile.phone}</strong>
        </div>
        <div className="info-row">
          <span>Village</span>
          <strong>{profile.village}</strong>
        </div>
        <div className="info-row">
          <span>Bio</span>
          <strong>{profile.bio}</strong>
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx global>{`
        .profile-shell { display: grid; gap: 22px; }
        .profile-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) 320px; gap: 20px; align-items: start; }
        .profile-main { background: #fff; border: 1px solid #e3ebdf; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 32px rgba(10, 46, 28, 0.08); }
        .profile-cover { position: relative; height: 220px; background: linear-gradient(135deg, #0f6338, #0d874d); }
        .profile-cover img { object-fit: cover; filter: saturate(0.9) brightness(0.75); }
        .cover-change { position: absolute; right: 18px; bottom: 18px; border: 0; border-radius: 10px; background: rgba(255,255,255,0.92); color: #134a2c; font-weight: 700; padding: 10px 12px; }
        .profile-body { padding: 0 26px 26px; }
        .profile-avatar-wrap { margin-top: -54px; display: flex; justify-content: space-between; align-items: end; }
        .profile-avatar { position: relative; width: 112px; height: 112px; border-radius: 50%; overflow: hidden; border: 5px solid #fff; background: #edf5ee; }
        .profile-avatar img { object-fit: cover; }
        .profile-verified { position: absolute; right: 4px; bottom: 5px; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: #0f6738; color: white; font-size: 12px; border: 2px solid #fff; }
        .profile-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-top: 16px; }
        .profile-header h2 { margin: 0; font-size: 2rem; letter-spacing: -0.04em; }
        .profile-identity-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
        .profile-handle { color: #667367; margin: 0; }
        .verified-chip { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #fff8df, #ebf9f0); color: #0f6738; border: 1px solid #d9c77a; border-radius: 999px; padding: 6px 10px; font-size: 0.73rem; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; box-shadow: 0 8px 18px rgba(15, 103, 56, 0.12); }
        .verified-badge-mark { width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(135deg, #1a8755, #0b6737); color: #fff; font-size: 0.72rem; }
        .profile-meta { margin-top: 12px; color: #4f6154; font-size: 0.9rem; }
        .profile-bio { margin-top: 14px; color: #465146; line-height: 1.65; max-width: 60ch; }
        .profile-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid #edf1ed; border-bottom: 1px solid #edf1ed; margin-top: 18px; padding: 16px 0; }
        .profile-stats div { text-align: center; }
        .profile-stat-button { display: block; width: 100%; border: 0; background: transparent; color: inherit; text-align: center; cursor: pointer; }
        .profile-stat-button:hover strong, .profile-stat-button:focus-visible strong { color: #0f6738; }
        .profile-stats strong { display: block; font-size: 1.4rem; }
        .profile-stats span { color: #68766c; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.12em; }
        .profile-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
        .button, .button-secondary, .danger-button { border: 0; border-radius: 999px; padding: 12px 18px; font-weight: 700; cursor: pointer; }
        .button { background: linear-gradient(135deg, #0f6738, #0b4d2d); color: white; }
        .button-secondary { background: white; color: #124d30; border: 1px solid #dfeae1; }
        .danger-button { background: #fff1f0; color: #a2281a; border: 1px solid #f1c5be; }
        .content-tabs { display: flex; gap: 30px; border-bottom: 1px solid #edf0eb; padding: 0 26px; margin-top: 10px; }
        .content-tabs button { background: transparent; border: 0; font-weight: 700; color: #5a685d; padding: 15px 0; cursor: pointer; position: relative; }
        .content-tabs button.active { color: #0f6738; }
        .content-tabs button.active::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; background: #0f6738; border-radius: 20px; }
        .content-panel { padding: 20px 26px 30px; }
        .story-list, .resource-list { display: grid; gap: 16px; }
        .story-card { background: #f9faf8; border: 1px solid #ebefe9; border-radius: 18px; padding: 18px; }
        .story-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .story-avatar { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(135deg, #d9ead9, #a9d7b3); color: #123f2a; font-weight: 700; }
        .story-head strong { display: block; }
        .story-head small { color: #697267; }
        .story-card h3 { margin: 0 0 8px; }
        .story-card p { margin: 0; color: #4d5a4f; line-height: 1.7; }
        .story-actions { display: flex; gap: 18px; margin-top: 14px; color: #536155; font-size: 0.83rem; }
        .profile-composer { display: grid; gap: 14px; padding: 18px; border: 1px solid #dfe9df; border-radius: 18px; background: #fbfefb; }
        .profile-composer textarea { width: 100%; resize: vertical; border: 1px solid #d9e5da; border-radius: 12px; padding: 12px; font: inherit; color: #1d2b22; background: #fff; }
        .composer-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .composer-actions input { display: none; }
        .composer-preview { width: 100%; max-height: 260px; object-fit: cover; border-radius: 14px; border: 1px solid #e1ebe2; }
        .profile-save-message { margin: 0; color: #0f6738; font-size: 0.82rem; font-weight: 700; }
        .composer-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .photo-tile { height: 120px; border-radius: 18px; background: linear-gradient(135deg, #dcefe0, #b2ddb0); display: grid; place-items: center; font-size: 2.2rem; color: #0d4d2d; border: 1px solid #dfeae0; }
        .resource-item { display: flex; align-items: center; gap: 12px; background: #f9faf8; border: 1px solid #ebefe9; border-radius: 14px; padding: 14px 16px; }
        .resource-badge { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: linear-gradient(135deg, #d8efdc, #bfe2c5); color: #0d4d2d; font-weight: 700; }
        .resource-item strong { display: block; }
        .resource-item small { color: #647164; }
        .about-panel { display: grid; gap: 10px; }
        .info-row { display: grid; grid-template-columns: 140px 1fr; gap: 16px; padding: 13px 0; border-bottom: 1px solid #edf0eb; }
        .info-row span { color: #697267; }
        .info-row strong { color: #1d2b22; line-height: 1.6; }
        .profile-aside { display: grid; gap: 18px; }
        .side-card { background: #fff; border: 1px solid #e3ebdf; border-radius: 22px; padding: 18px; box-shadow: 0 12px 32px rgba(10, 46, 28, 0.06); }
        .side-card h3 { margin: 0 0 14px; font-size: 1rem; }
        .side-menu { display: grid; gap: 8px; }
        .menu-button { background: #f5faf5; border: 1px solid transparent; border-radius: 12px; padding: 11px 12px; font-weight: 700; color: #234933; text-align: left; cursor: pointer; }
        .menu-button.active { background: #edf9f0; border-color: #d6ead7; color: #0f6738; }
        .settings-panel { background: #fff; border: 1px solid #e3ebdf; border-radius: 22px; padding: 24px; box-shadow: 0 12px 32px rgba(10, 46, 28, 0.05); }
        .settings-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .settings-head h3 { margin: 0; font-size: 1.4rem; }
        .section-grid { display: grid; gap: 18px; }
        .section-card { background: #fafbf9; border: 1px solid #ebefe9; border-radius: 18px; padding: 18px; }
        .section-card h4 { margin: 0 0 14px; font-size: 1rem; }
        .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .field { display: grid; gap: 7px; }
        .field label { font-size: 0.8rem; color: #5d685e; font-weight: 700; }
        .field input, .field textarea, .field select { width: 100%; border: 1px solid #dae4db; border-radius: 12px; background: white; padding: 11px 12px; font: inherit; color: #1d2a21; }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #2d3b30; font-weight: 600; padding: 9px 0; border-bottom: 1px solid #edf0eb; }
        .toggle-row:last-child { border-bottom: 0; }
        .switch { position: relative; width: 48px; height: 28px; background: #dfe8e1; border-radius: 999px; }
        .switch::after { content: ""; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: white; left: 5px; top: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
        .switch.on { background: #0f6738; }
        .switch.on::after { left: 25px; }
        .choice-list { display: grid; gap: 8px; }
        .choice { display: flex; align-items: center; gap: 10px; color: #2d3b30; }
        .choice input { accent-color: #0f6738; }
        .danger-zone { display: grid; gap: 12px; }
        .check-list { display: grid; gap: 12px; }
        .mini-list { display: grid; gap: 12px; }
        .mini-item { display: flex; align-items: center; justify-content: space-between; gap: 14px; background: #fafbf9; border: 1px solid #ebefe9; border-radius: 12px; padding: 12px 14px; }
        .profile-coin-mark { display: inline-grid; width: 1.2em; height: 1.2em; place-items: center; border: 1.5px solid currentColor; border-radius: 50%; font-family: Georgia, serif; line-height: 1; }
        .mini-item button { border: 0; border-radius: 999px; background: #eefaf0; color: #0f6738; padding: 8px 10px; font-weight: 700; cursor: pointer; }
        .hidden { display: none; }
        @media (max-width: 980px) {
          .profile-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .field-grid { grid-template-columns: 1fr; }
          .profile-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .photo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .content-tabs { gap: 16px; overflow-x: auto; white-space: nowrap; }
          .profile-header { flex-direction: column; }
        }
      `}</style>

      <AppShell title="My Profile" subtitle="Your public identity, community presence, and wallet in one place.">
        <div className="profile-shell">
          <div className="profile-layout">
            <div className="profile-main">
              <div className="profile-cover">
                <Image src={coverPreview || coverImage} alt="Profile cover" fill priority />
                <button className="cover-change" type="button" onClick={() => coverInputRef.current?.click()}>Change Cover</button>
              </div>

              <div className="profile-body">
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar">
                    <Image src={avatarPreview || avatarImage} alt="Profile photo" fill />
                    <span className="profile-verified">✓</span>
                  </div>
                </div>

                <div className="profile-header">
                  <div>
                    <h2>{profile.fullName}</h2>
                    <div className="profile-identity-row">
                      <p className="profile-handle">@{profile.username}</p>
                      {profile.isVerified ? (
                        <span className="verified-chip">
                          <span className="verified-badge-mark">✓</span>
                          {profile.verifiedBadge || "Verified"}
                        </span>
                      ) : null}
                    </div>
                    <div className="profile-meta">📍 {profile.village} • {liveLocation}</div>
                  </div>
                  <button className="button-secondary" onClick={() => setEditingProfile(true)}>Edit Profile</button>
                </div>

                <p className="profile-bio">{profile.bio}</p>

                <div className="profile-stats">
                  <button className="profile-stat-button" type="button" onClick={() => setActiveTab("Posts")}><strong>{profile.posts}</strong><span>Posts</span></button>
                  <button className="profile-stat-button" type="button" onClick={() => setActiveTab("Groups")}><strong>{profile.groups}</strong><span>Groups</span></button>
                  <button className="profile-stat-button" type="button" onClick={() => openConnections("followers")}><strong>{profile.followers}</strong><span>Followers</span></button>
                  <button className="profile-stat-button" type="button" onClick={() => openConnections("following")}><strong>{profile.following}</strong><span>Following</span></button>
                </div>

                <div className="profile-actions">
                  <button className="button" onClick={() => setPhotoSheetOpen(true)}>📸 Photos</button>
                  <button className="button-secondary" onClick={() => setSettingsSection("community")}>👥 My Groups</button>
                  <button className="button-secondary" onClick={() => setSettingsSection("wallet")}>💰 Wallet</button>
                </div>
              </div>

              <div className="content-tabs">
                {tabs.map((tab) => (
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

              <div className="content-panel">{renderTabContent()}</div>
            </div>

            <aside className="profile-aside">
              <div className="side-card">
                <h3>My Profile</h3>
                <div className="side-menu">
                  <button className="menu-button active" type="button">👤 Edit Profile</button>
                  <button className="menu-button" type="button" onClick={() => setPhotoSheetOpen(true)}>📸 Photos</button>
                  <button className="menu-button" type="button" onClick={() => setActiveTab("Posts")}>📝 My Posts</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("community")}>👥 My Groups</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("community")}>📄 My Pages</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("support")}>💬 Saved Posts</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("support")}>🔖 Saved Items</button>
                  <button className="menu-button" type="button" onClick={() => openConnections("followers")}>👥 Followers</button>
                  <button className="menu-button" type="button" onClick={() => openConnections("following")}>➕ Following</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("wallet")}>💰 Wallet</button>
                  <button className="menu-button" type="button">🪙 Buy Coins</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("account")}>⚙️ Settings</button>
                </div>
              </div>

              <div className="side-card">
                <h3>Options</h3>
                <div className="side-menu">
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("account")}>Account</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("privacy")}>Privacy</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("notifications")}>Notifications</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("appearance")}>Appearance</button>
                  <button className="menu-button" type="button" onClick={() => setSettingsSection("support")}>Help & Support</button>
                </div>
              </div>
            </aside>
          </div>

          <section className="settings-panel">
            <div className="settings-head">
              <h3>{selectedSettings.label}</h3>
              <button className="button-secondary" type="button" onClick={saveProfile} disabled={saveState.loading}>
                {saveState.loading ? "Saving..." : "Save"}
              </button>
            </div>

            {saveState.message ? <div style={{ marginBottom: 12, color: saveState.message.includes("success") ? "#0f6738" : "#a2281a", fontWeight: 700 }}>{saveState.message}</div> : null}

            <div className="section-grid">
              {settingsSection === "account" && (
                <>
                  <div className="section-card">
                    <h4>Personal Information</h4>
                    <div className="field-grid">
                      <div className="field">
                        <label>Name</label>
                        <input value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} />
                      </div>
                      <div className="field">
                        <label>Username</label>
                        <input value={form.username} onChange={(event) => updateForm("username", event.target.value)} />
                      </div>
                      <div className="field">
                        <label>Email</label>
                        <input value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                      </div>
                      <div className="field">
                        <label>Phone</label>
                        <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
                      </div>
                      <div className="field">
                        <label>Village</label>
                        <select value={form.village} onChange={(event) => updateForm("village", event.target.value)}>
                          <option>Umukulu</option>
                          <option>Amokolo</option>
                          <option>Ugwunagbo</option>
                          <option>Okwenachala</option>
                          <option>Ofeinyi</option>
                          <option>Amata</option>
                          <option>Umunevonta</option>
                          <option>Umuowoh</option>
                          <option>Umuonyiba</option>
                        </select>
                      </div>
                    </div>
                    <div className="field" style={{ marginTop: 14 }}>
                      <label>Bio</label>
                      <textarea rows={4} value={form.bio} onChange={(event) => updateForm("bio", event.target.value)} />
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>Security</h4>
                    <div className="mini-list">
                      <div className="mini-item"><span>Change Password</span><button type="button">Update</button></div>
                      <div className="mini-item"><span>Two-Factor Authentication</span><button type="button">Enable</button></div>
                      <div className="mini-item"><span>Login Activity</span><button type="button">View</button></div>
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>Login Activity</h4>
                    <div className="mini-list">
                      {loginActivity.map((item) => (
                        <div key={item.name} className="mini-item">
                          <span>
                            {item.name}
                            <small style={{ display: "block", color: "#647164" }}>{item.location}</small>
                          </span>
                          <button type="button">{item.status}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {settingsSection === "privacy" && (
                <>
                  <div className="section-card">
                    <h4>Who can see my profile?</h4>
                    <div className="choice-list">
                      {Object.entries(privacy).map(([key, value]) => (
                        <div className="choice" key={key}>
                          <span style={{ minWidth: 150, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
                          <select value={value} onChange={(event) => setPrivacy((current) => ({ ...current, [key]: event.target.value }))}>
                            {privacyChoices.map((choice) => (
                              <option key={choice} value={choice}>{choice}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>Blocked Accounts</h4>
                    <div className="mini-list">
                      {blockedAccounts.map((account) => (
                        <div key={account} className="mini-item">
                          <span>{account}</span>
                          <button type="button">Unblock</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {settingsSection === "notifications" && (
                <div className="section-card">
                  <h4>Push Notifications</h4>
                  <div className="check-list">
                    {notificationEntries.map(({ key, label }) => (
                      <div key={key} className="toggle-row">
                        <span>{label}</span>
                        <button
                          type="button"
                          className={`switch ${notificationState[key] ? "on" : ""}`}
                          onClick={() => setNotificationState((current) => ({ ...current, [key]: !current[key] }))}
                          aria-label={`Toggle ${label}`}
                          style={{ border: 0, cursor: "pointer" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settingsSection === "appearance" && (
                <>
                  <div className="section-card">
                    <h4>Theme</h4>
                    <div className="choice-list">
                      {['Light', 'Dark', 'System Default'].map((option) => (
                        <label key={option} className="choice">
                          <input type="radio" name="theme" checked={theme === option} onChange={() => setTheme(option)} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>Text Size</h4>
                    <div className="choice-list">
                      {['Small', 'Medium', 'Large'].map((option) => (
                        <label key={option} className="choice">
                          <input type="radio" name="textSize" checked={textSize === option} onChange={() => setTextSize(option)} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>Accessibility</h4>
                    <div className="toggle-row">
                      <span>Reduce Animations</span>
                      <button type="button" className={`switch ${reduceAnimations ? "on" : ""}`} onClick={() => setReduceAnimations((current) => !current)} aria-label="Toggle reduce animations" style={{ border: 0, cursor: "pointer" }} />
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>Language</h4>
                    <div className="choice-list">
                      {languageOptions.map((option) => (
                        <label key={option} className="choice">
                          <input type="radio" name="language" checked={selectedLanguage === option} onChange={() => setSelectedLanguage(option)} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {settingsSection === "community" && (
                <>
                  <div className="section-card">
                    <h4>My Groups</h4>
                    <div className="mini-list">
                      {groupItems.map((group) => (
                        <div key={group.name} className="mini-item">
                          <span>{group.name}</span>
                          <button type="button">Open</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>My Pages</h4>
                    <div className="mini-list">
                      {pages.map((page) => (
                        <div key={page.name} className="mini-item">
                          <span>
                            {page.name}
                            <small style={{ display: "block", color: "#647164" }}>{page.followers}</small>
                          </span>
                          <button type="button">Open</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {settingsSection === "wallet" && (
                <div className="section-card">
                  <h4>Wallet & Coins</h4>
                  <div className="mini-list">
                    <div className="mini-item"><span>Ituku Coin Balance</span><strong><ItukuCoinAmount amount={profile.walletBalance} /></strong></div>
                    <div className="mini-item"><span>Buy Coins</span><button type="button">Top up</button></div>
                    <div className="mini-item"><span>Transaction History</span><button type="button">View</button></div>
                  </div>
                </div>
              )}

              {settingsSection === "support" && (
                <>
                  <div className="section-card">
                    <h4>Help & Support</h4>
                    <div className="mini-list">
                      <div className="mini-item"><span>Help Center</span><button type="button">Open</button></div>
                      <div className="mini-item"><span>Frequently Asked Questions</span><button type="button">Read</button></div>
                      <div className="mini-item"><span>Report a Problem</span><button type="button">Submit</button></div>
                      <div className="mini-item"><span>Contact ItukuApp Support</span><button type="button">Email</button></div>
                    </div>
                  </div>

                  <div className="section-card">
                    <h4>Saved Items</h4>
                    <div className="choice-list">
                      {savedItems.map((option) => (
                        <label key={option} className="choice">
                          <input type="radio" name="saved" defaultChecked={option === "All"} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="danger-zone" style={{ marginTop: 24 }}>
              <button className="button-secondary" type="button" onClick={() => setLogoutOpen(true)}>🚪 Log Out</button>
              <button className="danger-button" type="button" onClick={() => setDeleteOpen(true)}>🗑️ Delete Account</button>
            </div>
          </section>
        </div>

        {photoSheetOpen && (
          <div className="modal-overlay" onClick={() => setPhotoSheetOpen(false)}>
            <div className="photo-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="photo-sheet-header">
                <h3>Ituku Profile Photo</h3>
              </div>

              <div className="avatar-preview">
                <Image src={avatarPreview || avatarImage} alt="Current profile" fill />
              </div>

              <div className="photo-actions">
                <button type="button" onClick={() => avatarInputRef.current?.click()}>📷 Change Photo</button>
                <button type="button" onClick={() => coverInputRef.current?.click()}>🖼 Change Cover</button>
                <button type="button" onClick={() => { setAvatarPreview(null); saveProfilePhoto(null); }}>🗑 Remove Photo</button>
              </div>

              <button className="cancel-button" type="button" onClick={() => setPhotoSheetOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {editingProfile && (
          <div className="modal-overlay" onClick={() => setEditingProfile(false)}>
            <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
              <h3>Personal Information</h3>
              <div className="field-grid">
                <div className="field">
                  <label>Name</label>
                  <input value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} />
                </div>
                <div className="field">
                  <label>Username</label>
                  <input value={form.username} onChange={(event) => updateForm("username", event.target.value)} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Village</label>
                  <select value={form.village} onChange={(event) => updateForm("village", event.target.value)}>
                    <option>Umukulu</option>
                    <option>Amokolo</option>
                    <option>Ugwunagbo</option>
                    <option>Okwenachala</option>
                    <option>Ofeinyi</option>
                    <option>Amata</option>
                    <option>Umunevonta</option>
                    <option>Umuowoh</option>
                    <option>Umuonyiba</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Bio</label>
                  <textarea rows={4} value={form.bio} onChange={(event) => updateForm("bio", event.target.value)} />
                </div>
              </div>

              <div className="modal-actions">
                <button className="button-secondary" type="button" onClick={() => setEditingProfile(false)}>Cancel</button>
                <button className="button" type="button" onClick={saveProfile}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {logoutOpen && (
          <div className="modal-overlay" onClick={() => setLogoutOpen(false)}>
            <div className="confirm-box" onClick={(event) => event.stopPropagation()}>
              <h3>Log out</h3>
              <p>Are you sure you want to log out of ItukuApp?</p>
              <div className="modal-actions">
                <button className="button-secondary" type="button" onClick={() => setLogoutOpen(false)}>Cancel</button>
                <button className="button" type="button" onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="modal-overlay" onClick={() => setDeleteOpen(false)}>
            <div className="confirm-box" onClick={(event) => event.stopPropagation()}>
              <h3>Delete Account</h3>
              <p>Deleting your account may permanently remove your profile, posts and other account information. Please confirm.</p>
              <div className="modal-actions">
                <button className="button-secondary" type="button" onClick={() => setDeleteOpen(false)}>Cancel</button>
                <button className="danger-button" type="button" onClick={handleDelete}>Delete Account</button>
              </div>
            </div>
          </div>
        )}

        {connectionsOpen && (
          <div className="modal-overlay" onClick={() => setConnectionsOpen(null)}>
            <div className="connections-panel" role="dialog" aria-modal="true" aria-labelledby="connections-title" onClick={(event) => event.stopPropagation()}>
              <div className="connections-head">
                <div><p className="eyebrow">YOUR NETWORK</p><h3 id="connections-title">{connectionsOpen === "followers" ? "Followers" : "Following"}</h3></div>
                <button className="close-connections" type="button" onClick={() => setConnectionsOpen(null)} aria-label="Close connections">×</button>
              </div>
              {connectionsLoading ? <p className="connections-state">Loading {connectionsOpen}...</p> : null}
              {!connectionsLoading && connectionsError ? <p className="connections-state connections-error">{connectionsError}</p> : null}
              {!connectionsLoading && !connectionsError && connections.length === 0 ? <p className="connections-state">No {connectionsOpen} yet.</p> : null}
              {!connectionsLoading && !connectionsError && connections.length > 0 ? <div className="connections-list">{connections.map((person) => <Link className="connection-item" href={`/profile/${person.username}`} key={person.id} onClick={() => setConnectionsOpen(null)}><span className="connection-avatar">{person.fullName.slice(0, 2).toUpperCase()}</span><span><strong>{person.fullName}</strong><small>@{person.username}</small>{person.bio ? <small>{person.bio}</small> : null}</span></Link>)}</div> : null}
            </div>
          </div>
        )}
      </AppShell>

      <style jsx global>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 20, 15, 0.42);
          display: grid;
          place-items: center;
          z-index: 30;
          padding: 22px;
        }
        .photo-sheet, .modal-panel, .confirm-box {
          width: min(520px, 100%);
          background: white;
          border-radius: 24px;
          padding: 22px;
          border: 1px solid #e5eee4;
          box-shadow: 0 20px 40px rgba(11, 34, 21, 0.12);
        }
        .photo-sheet-header h3, .modal-panel h3, .confirm-box h3 {
          margin: 0 0 18px;
        }
        .avatar-preview {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 18px;
          border: 4px solid #ebf1eb;
        }
        .avatar-preview img { object-fit: cover; }
        .photo-actions { display: grid; gap: 10px; }
        .photo-actions button, .cancel-button {
          border: 1px solid #dfeae1; background: #f8faf8; color: #1d3027; border-radius: 12px; padding: 11px 12px; font-weight: 700; cursor: pointer;
        }
        .cancel-button { width: 100%; margin-top: 16px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
        .confirm-box { width: min(420px, 100%); }
        .confirm-box p { color: #4f5d52; line-height: 1.7; }
        .connections-panel { width: min(560px, 100%); max-height: min(78vh, 680px); overflow: auto; background: #fff; border-radius: 24px; padding: 22px; border: 1px solid #e5eee4; box-shadow: 0 20px 40px rgba(11, 34, 21, 0.12); }
        .connections-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .connections-head h3 { margin: 0; font-size: 1.5rem; color: #1d3027; }
        .connections-head .eyebrow { margin-bottom: 6px; }
        .close-connections { border: 0; background: #f1f7f1; color: #355440; width: 34px; height: 34px; border-radius: 50%; font-size: 22px; cursor: pointer; }
        .connections-list { display: grid; gap: 8px; }
        .connection-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 14px; color: #1d3027; }
        .connection-item:hover { background: #f3f8f3; }
        .connection-avatar { display: grid; place-items: center; width: 44px; height: 44px; flex: 0 0 auto; border-radius: 50%; background: linear-gradient(135deg, #d9ead9, #a9d7b3); color: #123f2a; font-weight: 800; }
        .connection-item strong, .connection-item small { display: block; }
        .connection-item small { margin-top: 3px; color: #69776d; font-size: 0.78rem; }
        .connections-state { margin: 24px 0 10px; color: #5c6a60; text-align: center; }
        .connections-error { color: #a2281a; }
      `}</style>
    </>
  );
}
