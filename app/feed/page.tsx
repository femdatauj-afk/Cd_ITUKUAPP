"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { CommentThread } from "../components/comment-thread";
import { addPostComment, createPost, fetchFeed, getSession, likePost, sharePost, unlikePost, uploadFile } from "../lib/api";

const stories = [
  "Your story",
  "Amokolo",
  "Umukulu",
  "Youth Circle",
  "Market Hub",
];
type FeedPost = {
  id: string;
  author: string;
  village: string;
  time: string;
  body: string;
  comments: number;
  likes: number;
  badge: string;
  username?: string;
  photo?: string | null;
};

const defaultPosts: FeedPost[] = [
  {
    id: "p1",
    author: "Ituku Community Council",
    village: "Verified community page",
    time: "2h ago",
    body: "The community clean-up drive holds this Saturday at the town hall. Every village is encouraged to send volunteers.",
    comments: 24,
    likes: 128,
    badge: "IC",
  },
  {
    id: "p2",
    author: "Ada Okafor",
    village: "Amokolo",
    time: "4h ago",
    body: "A new opportunity is opening in the youth centre. Kindly share with young entrepreneurs and anyone looking to learn a new skill.",
    comments: 8,
    likes: 64,
    badge: "AO",
    username: "AminaEde",
  },
];

export default function FeedPage() {
  const [posts, setPosts] = useState(defaultPosts);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, string[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState("Feed");
  const [composerMode, setComposerMode] = useState<"post" | "photo" | "event" | "poll">("post");
  const [composerFile, setComposerFile] = useState<{ file: File; preview: string } | null>(null);
  const [eventDetails, setEventDetails] = useState("");
  const [pollDetails, setPollDetails] = useState("");
  const [composerNotice, setComposerNotice] = useState("");
  const [walletBalance, setWalletBalance] = useState(1000000);
  const [shareTags, setShareTags] = useState("");
  useEffect(() => {
    try {
      const savedLikes = JSON.parse(localStorage.getItem("ituku-liked-posts") || "[]");
      setLikedPosts(Array.isArray(savedLikes) ? savedLikes : []);
      const sessionBalance = Number(getSession()?.user?.walletBalance);
      if (Number.isFinite(sessionBalance)) setWalletBalance(sessionBalance);
    } catch { setLikedPosts([]); }
    fetchFeed()
      .then((data) => {
        if (data?.length)
          setPosts(
            data.map((item) => ({
              id: item.id,
              author: item.author?.fullName || "Community member",
              village: item.author?.village || "Ituku",
              time: "Recently",
              body: item.content,
              photo: item.photo,
              comments: item._count?.comments || 0,
              likes: item._count?.likes || 0,
              badge: (item.author?.fullName || "IT").slice(0, 2).toUpperCase(),
              username: item.author?.username,
            })),
          );
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Feed is temporarily unavailable.",
        ),
      );
  }, []);
  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !composerFile) return;
    setLoading(true);
    setError("");
    try {
      const postText = content.trim() || (composerMode === "photo" ? "Shared a photo with the community." : composerMode === "event" ? `Community event: ${eventDetails.trim() || "New event"}.` : `Community poll: ${pollDetails.trim() || "New poll"}.`);
      let mediaUrl: string | undefined;
      if (composerFile) {
        const upload = await uploadFile(composerFile.file, "posts");
        mediaUrl = upload.data.url;
      }
      const createdPost = await createPost(postText, mediaUrl);
      setPosts((prev) => [
        {
          id: createdPost.id,
          author: "You",
          village: "Ituku Community",
          time: "Just now",
          body: postText,
          photo: mediaUrl,
          comments: 0,
          likes: 0,
          badge: "YO",
        },
        ...prev,
      ]);
      setContent("");
      setComposerFile(null);
      setComposerMode("post");
      setEventDetails("");
      setPollDetails("");
      setComposerNotice("Published successfully.");
      window.setTimeout(() => setComposerNotice(""), 2200);
    } catch (err) {
      const postText = content.trim() || (composerMode === "photo" ? "Shared a photo with the community." : composerMode === "event" ? `Community event: ${eventDetails.trim() || "New event"}.` : `Community poll: ${pollDetails.trim() || "New poll"}.`);
      setPosts((prev) => [{ id: `local-post-${Date.now()}`, author: "You", username: getSession()?.user?.username, village: "Ituku Community", time: "Just now", body: postText, comments: 0, likes: 0, badge: "YO" }, ...prev]);
      setContent("");
      setComposerFile(null);
      setComposerMode("post");
      setEventDetails("");
      setPollDetails("");
      setError(
        err instanceof Error
          ? err.message
          : "Please sign in to publish a post.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function toggleLike(postId: string) {
    const currentlyLiked = likedPosts.includes(postId);
    try {
      const result = currentlyLiked ? await unlikePost(postId) : await likePost(postId);
      const nextLikes = currentlyLiked ? likedPosts.filter((id) => id !== postId) : [...likedPosts, postId];
      setLikedPosts(nextLikes);
      localStorage.setItem("ituku-liked-posts", JSON.stringify(nextLikes));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes: result.likesCount } : post,
        ),
      );
    } catch (err) {
      const nextLikes = currentlyLiked ? likedPosts.filter((id) => id !== postId) : [...likedPosts, postId];
      setLikedPosts(nextLikes);
      localStorage.setItem("ituku-liked-posts", JSON.stringify(nextLikes));
      setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, likes: Math.max(0, post.likes + (currentlyLiked ? -1 : 1)) } : post));
    }
  }

  async function submitComment(postId: string) {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    try { await addPostComment(postId, text); } catch { /* keep local fallback */ }
    setCommentsByPost((current) => ({ ...current, [postId]: [...(current[postId] || []), text] }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  }

  async function submitShare(postId: string) {
    try { await sharePost(postId); } catch { /* keep local fallback */ }
    setComposerNotice(`Shared to ${shareTarget}${shareTags.trim() ? ` and tagged ${shareTags.trim()}` : ""}.`);
    setSharePostId(null);
    setShareTags("");
    window.setTimeout(() => setComposerNotice(""), 2200);
  }
  return (
    <>
      <style jsx global>{`
        .feed-page-intro {
          display: none;
        }
        .feed-layout {
          display: grid;
          grid-template-columns: 205px minmax(0, 615px) 245px;
          gap: 17px;
          align-items: start;
        }
        .feed-rail,
        .feed-aside {
          display: grid;
          gap: 14px;
        }
        .rail-card,
        .trend-card,
        .composer-card,
        .feed-post {
          background: #fff;
          border: 1px solid #e2ebe0;
          border-radius: 17px;
          box-shadow: 0 7px 22px #11391d0c;
        }
        .rail-card {
          padding: 14px;
        }
        .profile-glance {
          display: flex;
          align-items: center;
          gap: 9px;
          padding-bottom: 12px;
          border-bottom: 1px solid #edf1eb;
        }
        .avatar-dot {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0b6737, #e8ad20);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 800;
        }
        .profile-glance strong {
          font-size: 12px;
        }
        .profile-glance small {
          display: block;
          font-size: 10px;
          color: #768076;
          margin-top: 2px;
        }
        .rail-link {
          display: flex;
          padding: 10px 4px;
          align-items: center;
          gap: 9px;
          font-size: 12px;
          font-weight: 600;
          color: #536056;
        }
        .rail-link span {
          font-size: 16px;
          color: #0b6737;
        }
        .rail-link:hover {
          color: #0b6737;
        }
        .stories-strip {
          display: flex;
          gap: 10px;
          padding: 11px;
          overflow: auto;
        }
        .feed-story {
          flex: 0 0 66px;
          text-align: center;
          font-size: 10px;
          color: #455046;
        }
        .story-ring {
          width: 47px;
          height: 47px;
          border-radius: 50%;
          margin: auto auto 5px;
          display: grid;
          place-items: center;
          color: #0b6737;
          background: #e7f2e5;
          border: 2px solid #0b6737;
          font-weight: 800;
        }
        .feed-story:first-child .story-ring {
          background: #0b6737;
          color: #fff;
        }
        .composer-card {
          padding: 15px;
        }
        .composer-row {
          display: flex;
          gap: 9px;
          align-items: center;
        }
        .composer-row input {
          flex: 1;
          border: 1px solid #e2eae0;
          background: #f8faf7;
          border-radius: 999px;
          padding: 11px 14px;
          font: inherit;
          font-size: 12px;
        }
        .composer-actions {
          display: flex;
          gap: 5px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #eef2ed;
        }
        .composer-actions button {
          flex: 1;
          border: 0;
          background: transparent;
          padding: 6px;
          color: #526058;
          font: 600 11px inherit;
          cursor: pointer;
        }
        .composer-actions button span {
          color: #0b6737;
          font-size: 14px;
        }
        .feed-post {
          padding: 16px;
          margin-top: 14px;
        }
        .post-top {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .post-top .more {
          margin-left: auto;
          color: #657065;
        }
        .post-top strong {
          font-size: 13px;
        }
        .post-top small {
          display: block;
          font-size: 10px;
          color: #778177;
          margin-top: 3px;
        }
        .post-body {
          font-size: 13px;
          line-height: 1.58;
          margin: 14px 0;
        }
        .post-art {
          min-height: 145px;
          border-radius: 12px;
          background: linear-gradient(125deg, #0a6035, #123b29);
          color: #fff;
          padding: 19px;
          position: relative;
          overflow: hidden;
        }
        .post-art:after {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          border: 1px solid #fff4;
          border-radius: 50%;
          right: -65px;
          top: -75px;
        }
        .post-art b {
          font-size: 19px;
          position: relative;
          z-index: 1;
        }
        .post-art span {
          display: block;
          font-size: 10px;
          margin-top: 8px;
          position: relative;
          z-index: 1;
        }
        .reaction-line {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #748074;
          padding: 11px 0;
        }
        .post-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #eef1ed;
          padding-top: 8px;
        }
        .post-buttons button {
          border: 0;
          background: transparent;
          color: #556157;
          font: 600 11px inherit;
          padding: 6px;
          cursor: pointer;
        }
        .feed-author-link { color: inherit; text-decoration: none; }
        .feed-author-link:hover { text-decoration: underline; }
        .composer-mode-label { display: inline-flex; align-items: center; gap: 5px; color: #0b6737; font: 600 11px inherit; cursor: pointer; }
        .feed-share-box, .feed-comment-box { display: flex; gap: 7px; align-items: center; margin-top: 9px; }
        .feed-share-box select, .feed-share-box input, .feed-comment-box input { min-width: 0; flex: 1; border: 1px solid #dfe9e0; border-radius: 9px; padding: 8px 10px; font: inherit; font-size: 11px; }
        .feed-share-box button, .feed-comment-box button { border: 0; border-radius: 999px; padding: 8px 11px; background: #0b6737; color: #fff; font-weight: 700; cursor: pointer; }
        .feed-comment { margin: 7px 0 0; padding: 7px 9px; border-radius: 9px; background: #f3f8f2; color: #536056; font-size: 11px; }
        .trend-card {
          padding: 16px;
        }
        .trend-card h3 {
          font-size: 14px;
          margin: 0 0 9px;
        }
        .trend-card a {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-top: 1px solid #eef1ed;
          font-size: 11px;
          font-weight: 700;
        }
        .trend-card small {
          font-size: 10px;
          color: #758075;
        }
        .notice {
          background: linear-gradient(135deg, #f9f2d9, #fffaf0);
          border-color: #f0e2b6;
        }
        .notice p {
          font-size: 11px;
          line-height: 1.5;
          color: #6a5c33;
          margin: 5px 0;
        }
        .feed-empty {
          font-size: 12px;
          color: #ae4040;
          margin: 8px 0 0;
        }
        @media (max-width: 1000px) {
          .feed-layout {
            grid-template-columns: 190px minmax(0, 1fr);
          }
          .feed-aside {
            display: none;
          }
        }
        @media (max-width: 700px) {
          .feed-layout {
            display: block;
          }
          .feed-rail {
            display: none;
          }
          .feed-post {
            border-radius: 15px;
          }
          .stories-strip {
            margin-bottom: 12px;
          }
          .composer-card {
            border-radius: 15px;
          }
        }
      `}</style>
      <AppShell title="Community Feed" subtitle="">
        <div className="feed-layout">
          <aside className="feed-rail">
            <section className="rail-card">
              <div className="profile-glance">
                <i className="avatar-dot">IU</i>
                <div>
                  <strong>Ujam Chinedu</strong>
                  <small>Amokolo village</small>
                </div>
              </div>
              <Link className="rail-link" href="/feed">
                <span>⌂</span>Home
              </Link>
              <Link className="rail-link" href="/groups">
                <span>♧</span>My communities
              </Link>
              <Link className="rail-link" href="/pages">
                <span>▣</span>Community pages
              </Link>
              <Link className="rail-link" href="/coins">
                <span>◉</span>Ituku coins
              </Link>
              <Link className="rail-link" href="/profile">
                <span>♙</span>My profile
              </Link>
            </section>
            <section className="rail-card">
              <p className="eyebrow">YOUR COMMUNITY</p>
              <strong style={{ fontSize: 12 }}>9 villages, one voice.</strong>
              <p style={{ fontSize: 11, color: "#697369", lineHeight: 1.5 }}>
                Find the people, updates and opportunities that matter.
              </p>
            </section>
          </aside>
          <main>
            <section className="stories-strip rail-card">
              {stories.map((story, index) => (
                <div className="feed-story" key={story}>
                  <div className="story-ring">
                    {index === 0 ? "＋" : story.slice(0, 2).toUpperCase()}
                  </div>
                  {story}
                </div>
              ))}
            </section>
            <form className="composer-card" onSubmit={publish}>
              <div className="composer-row">
                <i className="avatar-dot">IU</i>
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What’s happening in your community?"
                />
              </div>
              <div className="composer-actions">
                <button type="button" onClick={() => setComposerMode("photo")}>
                  <span>▧</span> Photo
                </button>
                <button type="button" onClick={() => setComposerMode("event")}>
                  <span>◉</span> Event
                </button>
                {composerMode === "event" ? <input className="composer-detail-input" value={eventDetails} onChange={(event) => setEventDetails(event.target.value)} placeholder="Event title, date, and place" /> : null}
                  {composerMode === "poll" ? <input className="composer-detail-input" value={pollDetails} onChange={(event) => setPollDetails(event.target.value)} placeholder="Poll question and choices" /> : null}
                <button type="button" onClick={() => setComposerMode("poll")}>
                  <span>▣</span> Poll
                </button>
                {composerMode === "photo" ? <label className="composer-mode-label">{composerFile ? "Media selected" : "Choose photo or video"}<input type="file" accept="image/*,video/mp4,video/webm" hidden onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setComposerFile({ file, preview: URL.createObjectURL(file) }); }} /></label> : null}
                <button type="submit" disabled={loading}>
                  <span>↑</span> {loading ? "Posting" : "Post"}
                </button>
              </div>
              {error && <p className="feed-empty">{error}</p>}
            </form>
            {posts.map((post, index) => (
              <article className="feed-post" key={post.id}>
                <div className="post-top">
                  <i className="avatar-dot">{post.badge}</i>
                  <div>
                    <strong>
                      {post.username ? <Link href={`/profile/${post.username}`} className="feed-author-link" onClick={(event) => event.stopPropagation()}>{post.author}</Link> : post.author}
                      {index === 0 && " ✓"}
                    </strong>
                    <small>
                      {post.village} · {post.time}
                    </small>
                  </div>
                  <span className="more">•••</span>
                </div>
                <p className="post-body">{post.body}</p>
                {post.photo ? (post.photo.match(/\.(mp4|webm)(\?|$)/i) ? <video className="post-media" controls src={post.photo} /> : <img className="post-media" src={post.photo} alt="Shared community media" />) : index === 0 && (
                  <div className="post-art">
                    <b>
                      ITUKU COMMUNITY
                      <br />
                      CLEAN-UP DAY
                    </b>
                    <span>Building a cleaner, stronger home—together.</span>
                  </div>
                )}
                <div className="reaction-line">
                  <span>● ♥ {post.likes}</span>
                  <span>{post.comments} comments · Share</span>
                </div>
                <div className="post-buttons">
                  <button
                    onClick={() => toggleLike(post.id)}
                    disabled={likedPosts.includes(post.id)}
                  >
                    {likedPosts.includes(post.id) ? "♥ Liked" : "♡ Like"}
                  </button>
                  <button type="button" onClick={() => document.getElementById(`comment-${post.id}`)?.focus()}>◌ Comment</button>
                  <button type="button" onClick={() => setSharePostId(sharePostId === post.id ? null : post.id)}>↗ Share</button>
                </div>
                {sharePostId === post.id ? <div className="feed-share-box"><select value={shareTarget} onChange={(event) => setShareTarget(event.target.value)} aria-label="Share destination"><option>Feed</option><option>Friends</option><option>Groups</option><option>Pages</option><option>Message</option></select><input value={shareTags} onChange={(event) => setShareTags(event.target.value)} placeholder="Tag users" aria-label="Tag users" /><button type="button" onClick={() => submitShare(post.id)}>Share now</button></div> : null}
                <CommentThread postId={post.id} onCountChange={(count) => setPosts((current) => current.map((item) => item.id === post.id ? { ...item, comments: count } : item))} />
              </article>
            ))}
          </main>
          <aside className="feed-aside">
            <section className="trend-card notice">
              <p className="eyebrow">COMMUNITY NOTICE</p>
              <strong>Stay connected.</strong>
              <p>Find verified updates and events from across ItukuApp.</p>
            </section>
            <section className="trend-card">
              <h3>Trending communities</h3>
              <Link href="/groups/g1">
                <span>
                  Youth Circle<small>208 members</small>
                </span>
                <b>→</b>
              </Link>
              <Link href="/groups/g2">
                <span>
                  Women Market Forum<small>97 members</small>
                </span>
                <b>→</b>
              </Link>
              <Link href="/pages/p1">
                <span>
                  Ituku Business Hub<small>812 followers</small>
                </span>
                <b>→</b>
              </Link>
            </section>
          </aside>
        </div>
      </AppShell>
    </>
  );
}
