"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { EntityNavigation } from "../../components/entity-navigation";
import { CommentThread } from "../../components/comment-thread";
import { createPagePost, fetchPage, fetchPagePosts, followPage, getCommunityPages, getSession, unfollowPage } from "../../lib/api";

type CommunityPage = {
  id: string;
  name: string;
  category: string;
  followers: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  description?: string | null;
  canManage?: boolean;
};

type PagePost = {
  id: string;
  content: string;
  likes: number;
  comments: number;
  createdAt: string;
  author: { fullName: string; username: string };
};

function getLocalFollowState(pageId: string) {
  if (typeof window === "undefined") return false;
  try {
    const state = JSON.parse(localStorage.getItem("ituku-page-follows") || "{}");
    return Boolean(state[pageId]);
  } catch {
    return false;
  }
}

function setLocalFollowState(pageId: string, following: boolean) {
  if (typeof window === "undefined") return;
  try {
    const state = JSON.parse(localStorage.getItem("ituku-page-follows") || "{}");
    state[pageId] = following;
    localStorage.setItem("ituku-page-follows", JSON.stringify(state));
  } catch {
    localStorage.setItem("ituku-page-follows", JSON.stringify({ [pageId]: following }));
  }
}

export default function PageDetail() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<CommunityPage | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState("");
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [postContent, setPostContent] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState("");
  const [canPublish, setCanPublish] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [pageAction, setPageAction] = useState<"invite" | "share" | null>(null);
  const [pageActionText, setPageActionText] = useState("");

  useEffect(() => {
    setCanPublish(Boolean(getSession()?.token));
    const fallback = getCommunityPages() as CommunityPage[];
    const seeded = fallback.find((item: CommunityPage) => item.id === id) ?? null;
    if (seeded) {
      setPage({ ...seeded, followers: seeded.followers || 0 });
      setFollowing(getLocalFollowState(id));
    }

    fetchPage(id)
      .then((remotePage) => {
        setPage({ ...remotePage, followers: remotePage.followers || remotePage._count?.followersOf || 0 });
        setFollowing(remotePage.isFollowing);
        setCanManage(remotePage.canManage);
        if (getSession()?.token) {
          return fetchPagePosts(id).then((response) => setPosts(response.data));
        }
        return undefined;
      })
      .catch(() => {
        setPage(seeded ? { ...seeded, followers: seeded.followers || 0 } : null);
        setFollowing(getLocalFollowState(id));
      });
  }, [id]);

  async function handleCreatePost(event: React.FormEvent) {
    event.preventDefault();
    if (!postContent.trim()) return;
    setPostLoading(true);
    setPostError("");
    try {
      const response = await createPagePost(id, postContent.trim());
      setPosts((current) => [response.data, ...current]);
      setPostContent("");
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "You do not have permission to publish on this page.");
    } finally {
      setPostLoading(false);
    }
  }

  async function handleFollow() {
    if (!getSession()?.token) {
      setFollowError("Sign in to follow this page.");
      return;
    }
    setFollowLoading(true);
    setFollowError("");
    try {
      const result = following ? await unfollowPage(id) : await followPage(id);
      setFollowing(result.following);
      setPage((current) => current ? { ...current, followers: result.followers } : current);
    } catch (error) {
      const nextFollowing = !following;
      setLocalFollowState(id, nextFollowing);
      setFollowing(nextFollowing);
      setPage((current) => current ? { ...current, followers: Math.max(0, current.followers + (nextFollowing ? 1 : -1)) } : current);
      setFollowError("Backend unavailable. Follow status saved on this device.");
    } finally {
      setFollowLoading(false);
    }
  }

  function submitPageAction() {
    if (!pageActionText.trim() || !pageAction) return;
    setFollowError(pageAction === "invite" ? `Invitation sent to ${pageActionText.trim()}.` : `Page shared to ${pageActionText.trim()}.`);
    setPageAction(null);
    setPageActionText("");
  }

  const count = page?.followers ?? 0;

  return (
    <AppShell title={page?.name || "Community Page"} subtitle="Follow community initiatives, businesses and organisations.">
      <EntityNavigation basePath={`/pages/${id}`} active="Overview" manageHref={canManage && page?.id ? `/pages/admins?pageId=${encodeURIComponent(page.id)}` : undefined} />
      <section className="panel-card community-detail">
        <p className="eyebrow">{page?.category || "ITUKU COMMUNITY PAGE"}</p>
        <h2>{page?.name || "Page not found"}</h2>
        <p className="intro"><strong>{count.toLocaleString()}</strong> followers · {page?.description || "Receive verified updates and community stories."}</p>
        <div className="community-count">
          <strong>{count.toLocaleString()}</strong>
          <span>Followers</span>
          <strong>Open</strong>
          <span>Community page</span>
        </div>
        <button className="button" type="button" onClick={handleFollow} disabled={followLoading || !page}>
          {followLoading ? "Updating..." : following ? "Following" : "Follow page"}
        </button>
        <button className="button secondary" type="button" onClick={() => setPageAction("invite")} disabled={!page}>Invite</button>
        <button className="button secondary" type="button" onClick={() => setPageAction("share")} disabled={!page}>Share</button>
        {pageAction ? <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.8rem" }}><input value={pageActionText} onChange={(event) => setPageActionText(event.target.value)} placeholder={pageAction === "invite" ? "Username or email" : "Where should this page be shared?"} /><div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}><button className="button" type="button" onClick={submitPageAction}>Submit</button><button className="button secondary" type="button" onClick={() => setPageAction(null)}>Cancel</button></div></div> : null}
        {followError ? <p className="form-error" role="alert">{followError}</p> : null}
        <Link className="text-link" href="/pages">Back to pages</Link>
        {canManage && page?.id ? <Link className="button secondary" href={`/pages/admins?pageId=${encodeURIComponent(page.id)}`}>Manage Page</Link> : null}
      </section>
      <section id="members" className="panel-card" style={{ marginTop: "1rem" }}>
        <p className="eyebrow">PAGE AUDIENCE</p>
        <h2 style={{ marginTop: 0 }}>People following this page</h2>
        <p className="intro"><strong>{count.toLocaleString()}</strong> followers receive updates from {page?.name || "this page"}.</p>
      </section>
      <section id="settings" className="panel-card" style={{ marginTop: "1rem" }}>
        <p className="eyebrow">PAGE INFORMATION</p>
        <h2 style={{ marginTop: 0 }}>Page settings</h2>
        <p className="intro">This is a {page?.category?.toLowerCase() || "community"} page. Page owners can manage profile details, publishing access and moderation from the admin area.</p>
        {canManage && page?.id ? <Link className="text-link" href={`/pages/admins?pageId=${encodeURIComponent(page.id)}`}>Open page administration</Link> : null}
      </section>
      <section id="posts" className="panel-card" style={{ marginTop: "1rem" }}>
        <p className="eyebrow">PAGE UPDATES</p>
        <h2 style={{ marginTop: 0 }}>Latest posts</h2>
        {canPublish ? (
          <form onSubmit={handleCreatePost} style={{ display: "grid", gap: "0.7rem", marginBottom: "1rem" }}>
            <textarea value={postContent} onChange={(event) => setPostContent(event.target.value)} placeholder="Share an update from this page" rows={3} />
            <button className="button" type="submit" disabled={postLoading}>{postLoading ? "Publishing..." : "Publish update"}</button>
            {postError ? <p className="form-error" role="alert">{postError}</p> : null}
          </form>
        ) : null}
        {posts.length > 0 ? posts.map((post) => (
          <article key={post.id} style={{ borderTop: "1px solid #e4ece5", padding: "1rem 0" }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{post.author.fullName}</p>
            <p style={{ margin: "0.35rem 0", whiteSpace: "pre-wrap" }}>{post.content}</p>
            <small style={{ color: "#647268" }}>{new Date(post.createdAt).toLocaleString()} · {post.likes} likes · {post.comments} comments</small>
            <CommentThread postId={post.id} basePath={`/pages/${encodeURIComponent(id)}/posts/${encodeURIComponent(post.id)}/comments`} />
          </article>
        )) : <p style={{ color: "#647268" }}>No updates yet.</p>}
      </section>
    </AppShell>
  );
}
