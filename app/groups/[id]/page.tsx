"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { canUserComment, rankPostsForFeed } from "../../lib/moderation";

const defaultGroupCover = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0%" stop-color="#0b6737"/>
      <stop offset="100%" stop-color="#6bbf59"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="420" fill="url(#g)"/>
  <circle cx="1100" cy="70" r="160" fill="rgba(255,255,255,0.08)"/>
  <circle cx="250" cy="360" r="200" fill="rgba(255,255,255,0.06)"/>
  <text x="80" y="200" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="700">ITUKUAPP</text>
  <text x="80" y="260" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-size="28">Community space</text>
</svg>
`)}`;

const defaultGroupProfile = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="p" x1="0" x2="1">
      <stop offset="0%" stop-color="#e3f7ea"/>
      <stop offset="100%" stop-color="#d8ebff"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="150" fill="url(#p)"/>
  <circle cx="150" cy="110" r="52" fill="#0e6d3e"/>
  <path d="M82 228c16-34 42-52 68-52s52 18 68 52" fill="#0e6d3e"/>
  <text x="150" y="268" text-anchor="middle" fill="#1b3a2d" font-family="Arial, sans-serif" font-size="32" font-weight="700">ITUKU</text>
</svg>
`)}`;

type RoleName = "admin" | "moderator" | "instructor" | "member";

type GroupMember = {
  id: string;
  name: string;
  role: RoleName;
  avatar: string;
};

type GroupPost = {
  id: string;
  author: string;
  role: RoleName;
  content: string;
  createdAt: string;
  media?: string;
  likes: number;
  comments: Array<{ id: string; author: string; text: string }>;
};

type Group = {
  id: string;
  name: string;
  category: string;
  description: string;
  members: number;
  profilePhoto: string;
  coverPhoto: string;
  rules: string[];
  membersList: GroupMember[];
  posts: GroupPost[];
};

const buildDefaultGroups = (): Group[] => [
  {
    id: "g1",
    name: "Youth Circle",
    category: "Youth",
    description: "A vibrant community for young people, student leaders, and ambition-driven conversations.",
    members: 208,
    profilePhoto: defaultGroupProfile,
    coverPhoto: defaultGroupCover,
    rules: ["Respect each other", "Share verified and relevant updates", "No spam or repeated promotion"],
    membersList: [
      { id: "u1", name: "Chinedu Henry", role: "admin", avatar: "CH" },
      { id: "u2", name: "Ada Okafor", role: "moderator", avatar: "AO" },
      { id: "u3", name: "Musa Ali", role: "instructor", avatar: "MA" },
      { id: "u4", name: "Bola Ketu", role: "member", avatar: "BK" },
    ],
    posts: [
      {
        id: "p1",
        author: "Ada Okafor",
        role: "moderator",
        content: "Our youth forum is hosting a productivity workshop on Saturday. Please bring a notebook and your ideas.",
        createdAt: "2h ago",
        likes: 27,
        comments: [{ id: "c1", author: "Musa Ali", text: "I’ll be there and I’m bringing a friend." }],
      },
    ],
  },
  {
    id: "g2",
    name: "Women Market Forum",
    category: "Business",
    description: "A safe support network for women entrepreneurs, small business owners and market traders.",
    members: 97,
    profilePhoto: defaultGroupProfile,
    coverPhoto: defaultGroupCover,
    rules: ["Support local women-owned businesses", "Keep advertisements relevant", "Use respectful language"],
    membersList: [
      { id: "u5", name: "Grace Bello", role: "admin", avatar: "GB" },
      { id: "u6", name: "Ngozi Ude", role: "moderator", avatar: "NU" },
      { id: "u7", name: "Ifeoma Dike", role: "member", avatar: "ID" },
    ],
    posts: [],
  },
  {
    id: "g3",
    name: "Community Development",
    category: "General",
    description: "Community projects, local updates, resource sharing and neighborhood coordination.",
    members: 54,
    profilePhoto: defaultGroupProfile,
    coverPhoto: defaultGroupCover,
    rules: ["Share truthful community updates", "Keep constructive feedback respectful", "Do not post sensitive personal data"],
    membersList: [
      { id: "u8", name: "Samuel Tobi", role: "admin", avatar: "ST" },
      { id: "u9", name: "Rita Nnaji", role: "instructor", avatar: "RN" },
      { id: "u10", name: "John Duru", role: "member", avatar: "JD" },
    ],
    posts: [],
  },
];

const readGroupsFromStorage = (): Group[] => {
  if (typeof window === "undefined") return buildDefaultGroups();

  const raw = localStorage.getItem("ituku-groups");
  if (!raw) {
    const seeded = buildDefaultGroups();
    localStorage.setItem("ituku-groups", JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Group[];
    return parsed.length ? parsed : buildDefaultGroups();
  } catch {
    const seeded = buildDefaultGroups();
    localStorage.setItem("ituku-groups", JSON.stringify(seeded));
    return seeded;
  }
};

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [newRule, setNewRule] = useState("");
  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleName>("moderator");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [joined, setJoined] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [memberNotice, setMemberNotice] = useState("");

  useEffect(() => {
    setGroups(readGroupsFromStorage());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && groups.length) {
      localStorage.setItem("ituku-groups", JSON.stringify(groups));
    }
  }, [groups]);

  const group = useMemo(
    () => groups.find((item) => item.id === id) ?? null,
    [groups, id],
  );

  if (!group) {
    return (
      <AppShell title="Community Group" subtitle="This group could not be found.">
        <section className="panel-card community-detail">
          <p className="eyebrow">ITUKUAPP GROUP</p>
          <h2>Group not found</h2>
          <p className="intro">The selected community is unavailable right now.</p>
          <Link className="text-link" href="/groups">Back to groups</Link>
        </section>
      </AppShell>
    );
  }

  const roleOptions: RoleName[] = ["moderator", "admin", "instructor", "member"];
  const shareOptions = ["Timeline", "Feed", "Profile", "Friends", "Pages", "Another Group", "WhatsApp", "Instagram", "X", "Message", "Website"];

  const updateGroup = (updater: (current: Group) => Group) => {
    setGroups((previous) => previous.map((item) => (item.id === group.id ? updater(item) : item)));
  };

  const handleRoleAssignment = () => {
    if (!selectedMemberId) return;

    updateGroup((current) => ({
      ...current,
      membersList: current.membersList.map((member) =>
        member.id === selectedMemberId ? { ...member, role: selectedRole } : member,
      ),
    }));
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;

    updateGroup((current) => ({
      ...current,
      rules: [...current.rules, newRule.trim()],
    }));
    setNewRule("");
  };

  const rankedPosts = useMemo<GroupPost[]>(() => {
    const ranked = rankPostsForFeed(
      group.posts.map((post) => ({
        ...post,
        comments: post.comments.length,
        shares: 0,
      })),
    ) as Array<{
      id: string;
      author: string;
      role: RoleName;
      content: string;
      createdAt: string;
      media?: string;
      likes: number;
      comments: number;
      shares: number;
    }>;

    return ranked.map(
      (item) => group.posts.find((post) => post.id === item.id) ?? ({ ...item, comments: [] } as GroupPost),
    );
  }, [group]);

  const handleAddPost = () => {
    if (!postText.trim() && !videoUrl.trim() && !mediaPreview) return;

    const newPost: GroupPost = {
      id: `post-${Date.now()}`,
      author: "You",
      role: "admin",
      content: postText.trim() || "Shared a new update with the group.",
      createdAt: "Just now",
      media: videoUrl.trim() || mediaPreview || undefined,
      likes: 0,
      comments: [],
    };

    updateGroup((current) => ({
      ...current,
      posts: [newPost, ...current.posts],
    }));
    setPostText("");
    setVideoUrl("");
    setMediaPreview(null);
  };

  const handleAddComment = (postId: string) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;
    if (!canUserComment(joined)) {
      setMemberNotice("Only members who joined the group can comment on posts.");
      window.setTimeout(() => setMemberNotice(""), 2200);
      return;
    }

    updateGroup((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, { id: `comment-${Date.now()}`, author: "You", text: draft }],
            }
          : post,
      ),
    }));

    setCommentDrafts((previous) => ({ ...previous, [postId]: "" }));
  };

  const handleShare = (target: string) => {
    setShareNotice(`Shared to ${target}.`);
    window.setTimeout(() => setShareNotice(""), 1800);
  };

  const handleMemberAction = (action: "friend" | "message", personName: string) => {
    setMemberNotice(action === "friend" ? `Friend request sent to ${personName}.` : `Message opened for ${personName}.`);
    window.setTimeout(() => setMemberNotice(""), 2200);
  };

  return (
    <AppShell title={group.name} subtitle={group.description}>
      <style jsx global>{`
        .group-detail-page { display: grid; gap: 1.2rem; }
        .group-header-card { background: #fff; border: 1px solid #e6ece6; border-radius: 26px; overflow: hidden; box-shadow: 0 12px 28px rgba(17, 54, 34, 0.08); }
        .group-cover { width: 100%; height: 220px; object-fit: cover; display: block; }
        .group-detail-body { padding: 1.1rem 1.4rem 1.5rem; }
        .group-profile-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-top: -62px; }
        .group-avatar-wrap { display: flex; align-items: center; gap: 1rem; }
        .group-profile-avatar { width: 104px; height: 104px; border-radius: 24px; border: 4px solid #fff; object-fit: cover; background: #edf8ef; }
        .group-title-block h1 { margin: 0; font-size: clamp(1.8rem, 3vw, 2.5rem); letter-spacing: -0.06em; }
        .group-title-block p { margin: 0.3rem 0 0; color: #4f5b57; }
        .join-btn { padding: 0.7rem 1.2rem; border-radius: 999px; background: linear-gradient(135deg, #0e6d3e, #0f9d59); color: white; border: 0; font-weight: 700; cursor: pointer; }
        .group-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr); gap: 1.2rem; }
        .panel-card { background: #fff; border: 1px solid #e6ece6; border-radius: 22px; padding: 1.2rem; box-shadow: 0 10px 22px rgba(16, 48, 30, 0.04); }
        .section-title { margin: 0 0 0.9rem; font-size: 1rem; letter-spacing: 0.04em; text-transform: uppercase; color: #596b60; }
        .group-rules, .role-row, .role-list, .member-grid, .share-menu { display: grid; gap: 0.7rem; }
        .rule-item { background: #f7faf7; border: 1px solid #ebf0eb; border-radius: 12px; padding: 0.7rem 0.8rem; color: #2d4138; }
        .role-select { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .role-select select, .rule-input, .composer-input, .video-url-input, .comment-input {
          width: 100%; border: 1px solid #dfe9e0; border-radius: 12px; padding: 0.8rem 0.9rem; font: inherit; background: white;
        }
        .role-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.8rem; border-radius: 999px; background: #eef4ff; color: #1a5dc6; font-weight: 700; }
        .member-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
        .member-card { background: #f6faf7; border: 1px solid #e6ece6; border-radius: 14px; padding: 0.8rem; }
        .member-name { display: flex; align-items: center; justify-content: space-between; margin-top: 0.65rem; }
        .avatar-pill { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(135deg, #dfeeff, #dcefe6); color: #183f2a; font-weight: 800; }
        .post-composer { display: grid; gap: 0.8rem; }
        .post-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .post-card { border: 1px solid #e9efeb; border-radius: 18px; background: #fff; padding: 1rem; display: grid; gap: 0.75rem; }
        .post-head { display: flex; justify-content: space-between; gap: 0.8rem; }
        .post-meta { display: flex; gap: 0.7rem; align-items: center; }
        .post-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .meta-pill { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem; border-radius: 999px; background: #edf5ff; font-size: 0.72rem; color: #1556b5; font-weight: 700; }
        .post-media { width: 100%; border-radius: 16px; border: 1px solid #e5eef2; object-fit: cover; max-height: 320px; }
        .post-actions-row, .comment-box { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .action-btn { border: 1px solid #e5ebf0; border-radius: 999px; background: #f5f8fb; padding: 0.5rem 0.8rem; font-weight: 700; color: #1d2939; cursor: pointer; }
        .share-menu { margin-top: 0.6rem; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
        .share-option { border: 1px solid #e8edf1; background: #fff; border-radius: 12px; padding: 0.6rem 0.7rem; cursor: pointer; }
        .notice { color: #0c6b3d; font-weight: 700; }
        .section-stack { display: grid; gap: 1rem; }
        @media (max-width: 820px) {
          .group-layout { grid-template-columns: 1fr; }
          .group-profile-row { align-items: center; }
          .group-avatar-wrap { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="group-detail-page">
        <section className="group-header-card">
          <img src={group.coverPhoto || defaultGroupCover} alt={`${group.name} cover`} className="group-cover" />
          <div className="group-detail-body">
            <div className="group-profile-row">
              <div className="group-avatar-wrap">
                <img src={group.profilePhoto || defaultGroupProfile} alt={`${group.name} profile`} className="group-profile-avatar" />
                <div className="group-title-block">
                  <h1>{group.name}</h1>
                  <p>
                    <strong>{group.members.toLocaleString()}</strong> members · {group.category} · Public group
                  </p>
                </div>
              </div>
              <button className="join-btn" type="button" onClick={() => setJoined((value) => !value)}>
                {joined ? "Joined ✓" : "Join group"}
              </button>
            </div>
          </div>
        </section>

        <div className="group-layout">
          <div className="section-stack">
            <section className="panel-card">
              <h3 className="section-title">About this group</h3>
              <p className="intro">{group.description}</p>
            </section>

            <section className="panel-card">
              <h3 className="section-title">Post to the group</h3>
              <div className="post-composer">
                <textarea
                  className="composer-input"
                  placeholder="Share information, updates, stories, or community news..."
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                />
                <input
                  className="video-url-input"
                  type="url"
                  placeholder="Paste video URL (optional)"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                />
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setMediaPreview(String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
                {mediaPreview ? (
                  <div>
                    {mediaPreview.startsWith("data:video") ? (
                      <video src={mediaPreview} controls style={{ width: "100%", maxHeight: 260, borderRadius: 16 }} />
                    ) : (
                      <img src={mediaPreview} alt="Group media uploaded preview" style={{ width: "100%", maxHeight: 260, borderRadius: 16, objectFit: "cover" }} />
                    )}
                  </div>
                ) : null}
                <div className="post-actions">
                  <button type="button" className="action-btn" onClick={() => { setVideoUrl(""); setMediaPreview(null); }}>Add photo</button>
                  <button type="button" className="action-btn" onClick={handleAddPost}>Post update</button>
                </div>
              </div>
            </section>

            <section className="panel-card">
              <h3 className="section-title">Community feed</h3>
              <div className="group-rules">
                {group.posts.length === 0 ? <p className="intro">No posts yet. Start the conversation.</p> : null}
                {rankedPosts.map((post) => (
                  <article key={post.id} className="post-card">
                    <div className="post-head">
                      <div className="post-meta">
                        <div className="avatar-pill">{post.author.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <strong>{post.author}</strong>
                          <div className="post-badges">
                            <span className="meta-pill">{post.role}</span>
                            <span className="meta-pill">{post.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p>{post.content}</p>
                    {post.media ? (
                      <video controls src={post.media} className="post-media" />
                    ) : null}
                    <div className="post-actions-row">
                      <button type="button" className="action-btn" onClick={() => updateGroup((current) => ({ ...current, posts: current.posts.map((entry) => entry.id === post.id ? { ...entry, likes: entry.likes + 1 } : entry) }))}>
                        👍 Like ({post.likes})
                      </button>
                      <button type="button" className="action-btn" onClick={() => setShareNotice("Share menu opened")}>↗ Share</button>
                    </div>

                    <div className="share-menu">
                      {shareOptions.map((option) => (
                        <button type="button" key={option} className="share-option" onClick={() => handleShare(option)}>
                          {option}
                        </button>
                      ))}
                    </div>

                    {shareNotice ? <div className="notice">{shareNotice}</div> : null}

                    <div className="comment-box">
                      <input
                        className="comment-input"
                        value={commentDrafts[post.id] ?? ""}
                        onChange={(event) =>
                          setCommentDrafts((previous) => ({ ...previous, [post.id]: event.target.value }))
                        }
                        placeholder="Write a comment..."
                      />
                      <button type="button" className="action-btn" onClick={() => handleAddComment(post.id)}>Comment</button>
                    </div>

                    {post.comments.length > 0 ? (
                      <div className="group-rules">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="rule-item">
                            <strong>{comment.author}</strong>: {comment.text}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="section-stack">
            <section className="panel-card">
              <h3 className="section-title">Group settings</h3>
              <div className="role-row">
                <div className="role-select">
                  <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
                    <option value="">Select member</option>
                    {group.membersList.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                  <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as RoleName)}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="join-btn" onClick={handleRoleAssignment}>Assign role</button>
              </div>

              <div className="role-list">
                {group.membersList.map((member) => (
                  <div key={member.id} className="member-card">
                    <div className="member-name">
                      <div className="avatar-pill">{member.avatar}</div>
                      <strong>{member.name}</strong>
                    </div>
                    <div className="role-chip">{member.role}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card">
              <h3 className="section-title">Group rules</h3>
              <div className="group-rules">
                {group.rules.map((rule, index) => (
                  <div key={`${rule}-${index}`} className="rule-item">{rule}</div>
                ))}
              </div>
              <div className="role-row" style={{ marginTop: "1rem" }}>
                <input
                  className="rule-input"
                  placeholder="Add a new group rule"
                  value={newRule}
                  onChange={(event) => setNewRule(event.target.value)}
                />
                <button type="button" className="join-btn" onClick={handleAddRule}>Update rule</button>
              </div>
            </section>

            <section className="panel-card">
              <h3 className="section-title">Moderation</h3>
              <div className="group-rules">
                <div className="rule-item">Admin can edit the group description, profile cover and community settings.</div>
                <div className="rule-item">Moderator has page management rights to appoint admins and enforce community standards.</div>
                <div className="rule-item">Instructor can share educational content, schedule sessions and coordinate group activity.</div>
                <div className="rule-item">Regular users can create posts, comments, like content, and share to other destinations.</div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
