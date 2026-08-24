"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { fetchPage, fetchPageAnalytics, fetchPageMembers, fetchPageSettings, fetchPages, getCommunityPages, getSession, removePageMember, saveCommunityPages, updatePageMember, updatePageProfile, updatePageSettings, uploadFile, type PageSettings } from "../../lib/api";

type PageSummary = { id: string; name: string; owner?: { id?: string } };
type PageMember = { id: string; userId: string; role: string; user: { fullName: string; username: string } };
type PageAnalytics = { followers: number; posts: number; views: number; followerAdds: number; followerDrops: number; postReach: number; postEngagement: number };
type PageProfile = { name: string; category: string; description: string; website: string; phone: string; address: string; profilePhoto: string; coverPhoto: string };

export default function PagesAdminsPage() {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [pageId, setPageId] = useState("");
  const [members, setMembers] = useState<PageMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [analytics, setAnalytics] = useState<PageAnalytics | null>(null);
  const [profile, setProfile] = useState<PageProfile | null>(null);
  const [uploading, setUploading] = useState<"profilePhoto" | "coverPhoto" | "">("");
  const [localDemo, setLocalDemo] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const localPages = getCommunityPages().map((page) => ({ id: page.id, name: page.name }));
    fetchPages()
      .then((result) => {
        const currentUserId = getSession()?.user?.id;
        const requestedPageId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("pageId");
        const owned = result.filter((page) => !page.owner?.id || page.owner.id === currentUserId || page.id === requestedPageId);
        const available = owned.length > 0 ? owned : localPages;
        setPages(available);
        const nextPageId = available.find((page) => page.id === requestedPageId)?.id || available[0]?.id || "";
        setPageId(nextPageId);
        setLocalDemo(owned.length === 0);
      })
      .catch(() => {
        setPages(localPages);
        const requestedPageId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("pageId");
        setPageId(localPages.find((page) => page.id === requestedPageId)?.id || localPages[0]?.id || "");
        setLocalDemo(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pageId || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("pageId", pageId);

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }, [pageId, localDemo]);

  useEffect(() => {
    if (!pageId) return;
    setError("");
    if (localDemo) {
      const localPage = getCommunityPages().find((page) => page.id === pageId);
      if (localPage) {
        setProfile({ name: localPage.name, category: localPage.category, description: "Receive verified updates and community stories.", website: "", phone: "", address: "", profilePhoto: "", coverPhoto: "" });
        setAnalytics({ followers: localPage.followers || 0, posts: 0, views: 0, followerAdds: 0, followerDrops: 0, postReach: 0, postEngagement: 0 });
      }
      setMembers([]);
      setSettings({ allowMessages: true, allowComments: true, allowUserPosts: true, followerVisibility: "public", defaultPostStatus: "published" });
      return;
    }
    fetchPageMembers(pageId)
      .then(setMembers)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load page members."));
    fetchPage(pageId)
      .then((page) => setProfile({
        name: page.name,
        category: page.category,
        description: page.description || "",
        website: page.website || "",
        phone: page.phone || "",
        address: page.address || "",
        profilePhoto: page.profilePhoto || "",
        coverPhoto: page.coverPhoto || "",
      }))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load page profile."));
    Promise.all([fetchPageSettings(pageId), fetchPageAnalytics(pageId)])
      .then(([nextSettings, nextAnalytics]) => {
        setSettings(nextSettings);
        setAnalytics(nextAnalytics);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load page settings."));
  }, [pageId, localDemo]);

  async function changeSetting(key: keyof PageSettings, value: boolean | string) {
    if (localDemo) {
      setSettings((current) => current ? { ...current, [key]: value } : current);
      return;
    }
    try {
      const updated = await updatePageSettings(pageId, { [key]: value });
      setSettings(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save page settings.");
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    if (localDemo) {
      const localPages = getCommunityPages();
      saveCommunityPages(localPages.map((page) => page.id === pageId ? { ...page, ...profile } : page));
      return;
    }
    try {
      const updated = await updatePageProfile(pageId, profile);
      setProfile((current) => current ? { ...current, name: updated.name, category: updated.category, description: updated.description || "", website: updated.website || "", phone: updated.phone || "", address: updated.address || "" } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save page profile.");
    }
  }

  async function uploadPageImage(event: React.ChangeEvent<HTMLInputElement>, field: "profilePhoto" | "coverPhoto") {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    setUploading(field);
    setError("");
    try {
      if (localDemo) {
        const reader = new FileReader();
        reader.onload = () => {
          const url = String(reader.result);
          setProfile((current) => current ? { ...current, [field]: url } : current);
          const localPages = getCommunityPages();
          saveCommunityPages(localPages.map((page) => page.id === pageId ? { ...page, [field]: url } : page));
        };
        reader.readAsDataURL(file);
        return;
      }
      const result = await uploadFile(file, field === "profilePhoto" ? "page-profiles" : "page-covers");
      const url = result.data?.url || result.url;
      if (!url) throw new Error("Upload did not return an image URL.");
      const updated = await updatePageProfile(pageId, { [field]: url });
      setProfile((current) => current ? { ...current, [field]: updated[field] || url } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload page image.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  async function changeRole(member: PageMember, role: string) {
    try {
      const updated = await updatePageMember(pageId, member.userId, role);
      setMembers((current) => current.map((item) => item.userId === member.userId ? { ...item, role: updated.role } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update this role.");
    }
  }

  async function removeMember(member: PageMember) {
    try {
      await removePageMember(pageId, member.userId);
      setMembers((current) => current.filter((item) => item.userId !== member.userId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove this member.");
    }
  }

  return (
    <AppShell title="Page admins" subtitle="Manage the people who help publish and protect your pages.">
      <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">PAGE GOVERNANCE</p>
            <h2 style={{ margin: 0 }}>Leadership and permissions</h2>
          </div>
          <Link href="/pages" className="text-link">Back to pages</Link>
        </div>
        {pages.length > 0 ? (
          <select value={pageId} onChange={(event) => setPageId(event.target.value)} style={{ marginTop: "1rem", padding: "0.75rem", minWidth: 260 }}>
            {pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
          </select>
        ) : null}
      </section>

      {loading ? <section className="panel-card">Loading page governance...</section> : null}
      {error ? <section className="panel-card form-error" role="alert">{error}</section> : null}
      {!loading && !error && members.length === 0 ? <section className="panel-card">{localDemo ? "No additional page members in the local demo." : "No manageable page members found."}</section> : null}
      {analytics ? (
        <section className="card-grid" style={{ marginBottom: "1rem" }}>
          {[
            ["Followers", analytics.followers],
            ["Posts", analytics.posts],
            ["Views", analytics.views],
            ["Engagement", analytics.postEngagement],
          ].map(([label, value]) => <article className="panel-card" key={label}><p className="eyebrow">{label}</p><strong style={{ fontSize: "1.8rem" }}>{Number(value).toLocaleString()}</strong></article>)}
        </section>
      ) : null}
      <section className="card-grid">
        {members.map((member) => (
          <article key={member.id} className="panel-card">
            <h3 style={{ marginTop: 0 }}>{member.user.fullName}</h3>
            <p style={{ color: "#536155" }}>@{member.user.username}</p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
              <select value={member.role} disabled={member.role === "owner"} onChange={(event) => changeRole(member, event.target.value)}>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
              </select>
              {member.role !== "owner" ? <button className="button secondary" type="button" onClick={() => removeMember(member)}>Remove</button> : <span className="status-pill">Owner</span>}
            </div>
          </article>
        ))}
      </section>
      {profile ? (
        <section className="panel-card" style={{ marginTop: "1rem" }}>
          <p className="eyebrow">PAGE IDENTITY</p>
          <h2 style={{ marginTop: 0 }}>Public profile</h2>
          <form onSubmit={saveProfile} style={{ display: "grid", gap: "0.7rem" }}>
            <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Page name" required />
            <select value={profile.category} onChange={(event) => setProfile({ ...profile, category: event.target.value })}>
              <option>Business</option>
              <option>Church</option>
              <option>School</option>
              <option>Organization</option>
              <option>Community</option>
            </select>
            <textarea value={profile.description} onChange={(event) => setProfile({ ...profile, description: event.target.value })} placeholder="Description" rows={3} />
            <input value={profile.website} onChange={(event) => setProfile({ ...profile, website: event.target.value })} placeholder="Website" type="url" />
            <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="Phone" />
            <input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} placeholder="Address" />
            {profile.coverPhoto || profile.profilePhoto ? (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(120px, 1fr)", gap: "0.7rem" }}>
                {profile.coverPhoto ? <img src={profile.coverPhoto} alt="Page cover preview" style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 12 }} /> : <div style={{ minHeight: 96, borderRadius: 12, background: "#eef5ef" }} />}
                {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Page profile preview" style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 12 }} /> : <div style={{ minHeight: 96, borderRadius: 12, background: "#eef5ef" }} />}
              </div>
            ) : null}
            <div style={{ display: "grid", gap: "0.6rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <input ref={coverPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => uploadPageImage(event, "coverPhoto")} />
              <input ref={profilePhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => uploadPageImage(event, "profilePhoto")} />
              <button className="button secondary" type="button" onClick={() => coverPhotoInputRef.current?.click()} disabled={Boolean(uploading)}>{uploading === "coverPhoto" ? "Uploading cover..." : "Upload cover photo"}</button>
              <button className="button secondary" type="button" onClick={() => profilePhotoInputRef.current?.click()} disabled={Boolean(uploading)}>{uploading === "profilePhoto" ? "Uploading profile..." : "Upload profile photo"}</button>
            </div>
            <button className="button" type="submit">Save public profile</button>
          </form>
        </section>
      ) : null}
      {settings ? (
        <section className="panel-card" style={{ marginTop: "1rem" }}>
          <p className="eyebrow">PAGE SETTINGS</p>
          <h2 style={{ marginTop: 0 }}>Audience and publishing controls</h2>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {([
              ["allowMessages", "Allow messages"],
              ["allowComments", "Allow comments"],
              ["allowUserPosts", "Allow follower posts"],
            ] as Array<[keyof PageSettings, string]>).map(([key, label]) => (
              <label key={key} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => changeSetting(key, event.target.checked)} />
                {label}
              </label>
            ))}
            <label style={{ display: "grid", gap: "0.35rem" }}>Follower visibility
              <select value={settings.followerVisibility} onChange={(event) => changeSetting("followerVisibility", event.target.value)}>
                <option value="public">Public</option>
                <option value="members">Members only</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
