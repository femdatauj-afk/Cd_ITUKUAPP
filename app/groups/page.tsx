"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { createGroup, fetchGroups } from "../lib/api";

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

type GroupUser = {
  id: string;
  name: string;
  role: "admin" | "moderator" | "instructor" | "member";
  avatar: string;
};

type GroupPost = {
  id: string;
  author: string;
  role: "admin" | "moderator" | "instructor" | "member";
  content: string;
  createdAt: string;
  media?: string;
  likes: number;
  comments: Array<{ id: string; author: string; text: string }>;
};

type Group = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  description: string;
  members: number;
  profilePhoto: string;
  coverPhoto: string;
  rules: string[];
  membersList: GroupUser[];
  posts: GroupPost[];
};

const categoryOptions = ["All", "General", "Youth", "Business", "Culture"];

const seedGroups: Group[] = [
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
        comments: [
          { id: "c1", author: "Musa Ali", text: "I’ll be there and I’m bringing a friend." },
        ],
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

const readGroups = (): Group[] => {
  if (typeof window === "undefined") return seedGroups;
  const raw = localStorage.getItem("ituku-groups");
  if (!raw) {
    localStorage.setItem("ituku-groups", JSON.stringify(seedGroups));
    return seedGroups;
  }

  try {
    const parsed = JSON.parse(raw) as Group[];
    return parsed.length ? parsed.map((group) => ({
      ...group,
      slug: group.slug || `${group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${group.id}`,
    })) : seedGroups;
  } catch {
    localStorage.setItem("ituku-groups", JSON.stringify(seedGroups));
    return seedGroups;
  }
};

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(seedGroups);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(defaultGroupProfile);
  const [coverPhoto, setCoverPhoto] = useState(defaultGroupCover);
  const [followedGroups, setFollowedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ituku-followed-groups") || "{}");
      setFollowedGroups(saved && typeof saved === "object" ? saved : {});
    } catch {
      setFollowedGroups({});
    }
  }, []);

  const toggleGroupFollow = (groupId: string) => {
    setFollowedGroups((current) => {
      const next = { ...current, [groupId]: !current[groupId] };
      localStorage.setItem("ituku-followed-groups", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const savedGroups = readGroups();
    setGroups(savedGroups);
    fetchGroups().then((remoteGroups) => {
      setGroups((current) => {
        const existingIds = new Set(current.map((group) => group.id));
        const remote = remoteGroups
          .filter((group) => !existingIds.has(group.id))
          .map((group) => ({
            id: group.id,
            slug: group.slug,
            name: group.name,
            category: group.category,
            description: "Community group for local updates and collaboration.",
            members: group._count.members,
            profilePhoto: defaultGroupProfile,
            coverPhoto: defaultGroupCover,
            rules: [],
            membersList: [],
            posts: [],
          }));
        return [...remote, ...current];
      });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ituku-groups", JSON.stringify(groups));
    }
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesCategory = selectedFilter === "All" || group.category === selectedFilter;
      const matchesSearch = searchTerm.trim().length === 0 || group.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [groups, searchTerm, selectedFilter]);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      let created: { id: string; slug: string } | null = null;
      try {
        created = await createGroup({ name: groupName.trim(), category });
      } catch {
        created = null;
      }
      const newGroup: Group = {
        id: created?.id || `g${Date.now()}`,
        slug: created?.slug || `${groupName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`,
        name: groupName.trim(),
        category,
        description: groupDescription.trim() || "A dedicated community for learning, updates, and collaboration.",
        members: 1,
        profilePhoto: profilePhoto || defaultGroupProfile,
        coverPhoto: coverPhoto || defaultGroupCover,
        rules: [
          "Be respectful and constructive.",
          "Share quality updates and relevant media.",
          "Admin and moderators are responsible for keeping the group safe.",
        ],
        membersList: [
          { id: "me-admin", name: "You", role: "admin", avatar: "YO" },
        ],
        posts: [],
      };

      setGroups((previous) => [newGroup, ...previous]);
      setGroupName("");
      setGroupDescription("");
      setProfilePhoto(defaultGroupProfile);
      setCoverPhoto(defaultGroupCover);
      setSuccessMsg("Group created successfully. Default ITUKUAPP branding is active until the admin changes it.");
    } catch {
      setError("Unable to create your group right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Groups" subtitle="Create, manage and join collaborative communities for support, projects and civic action.">
      <style jsx global>{`
        .groups-page { display: grid; gap: 1.4rem; }
        .group-toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; }
        .group-search { flex: 1 1 240px; max-width: 420px; border: 1px solid #dfe9e0; background: #fff; border-radius: 14px; padding: 0.8rem 0.95rem; font: inherit; color: #1d2a21; }
        .filter-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .filter-pill { border: 1px solid #dfe9e0; background: #f4faf4; color: #244b33; border-radius: 999px; padding: 0.55rem 0.9rem; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
        .filter-pill.active { background: linear-gradient(135deg, #0f6738, #0b4d2d); color: white; border-color: transparent; }
        .group-create-card { background: #fff; border: 1px solid #e3ebdf; border-radius: 22px; padding: 1.35rem; box-shadow: 0 12px 30px rgba(10, 46, 28, 0.05); }
        .group-create-card h2 { margin: 0; font-size: 1.5rem; letter-spacing: -0.04em; }
        .group-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .group-form input, .group-form textarea, .group-form select { border: 1px solid #dfe9e0; border-radius: 12px; padding: 0.85rem 1rem; font: inherit; color: #1d2a21; background: white; width: 100%; }
        .group-form textarea { min-height: 120px; resize: vertical; }
        .group-form .file-field { display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        .group-form .file-field label { font-size: 0.82rem; font-weight: 700; color: #2d473a; }
        .group-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .group-card { display: block; background: #fff; border: 1px solid #e3ebdf; border-radius: 20px; padding: 0; overflow: hidden; box-shadow: 0 10px 28px rgba(10, 46, 28, 0.05); transition: transform 0.2s ease; }
        .group-card:hover { transform: translateY(-2px); }
        .group-cover { width: 100%; height: 110px; object-fit: cover; display: block; }
        .group-card-body { padding: 1rem 1.1rem 1.2rem; }
        .group-card-head { display: flex; align-items: center; gap: 0.8rem; margin-top: -28px; }
        .group-avatar { width: 50px; height: 50px; border-radius: 16px; border: 4px solid #fff; object-fit: cover; background: #eef8ee; }
        .group-badge { background: #edf9f0; color: #0f6738; border-radius: 999px; padding: 0.35rem 0.7rem; font-size: 0.72rem; font-weight: 800; }
        .group-card h3 { margin: 0.8rem 0 0.35rem; font-size: 1.15rem; }
        .group-card p { margin: 0; color: #536155; line-height: 1.6; }
        .group-card strong { color: #123f2a; }
        .group-card .read-more { display: inline-flex; margin-top: 0.9rem; font-size: 0.8rem; font-weight: 800; color: #0f6738; }
        .group-card-actions { display: flex; align-items: center; justify-content: space-between; gap: .6rem; margin-top: .8rem; }
        .follow-button { border: 1px solid #0f6738; border-radius: 999px; background: #fff; color: #0f6738; padding: .55rem .8rem; font-weight: 800; cursor: pointer; }
        .follow-button.following { background: #0f6738; color: #fff; }
        @media (max-width: 700px) {
          .group-toolbar { align-items: stretch; }
          .group-search { max-width: none; }
          .group-form { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="groups-page">
        <div className="groups-header">
          <div className="group-toolbar">
            <input className="group-search" type="text" placeholder="Search groups..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search groups" />
            <div className="filter-pills" aria-label="Group filters">
              {categoryOptions.map((option) => (
                <button key={option} type="button" className={`filter-pill ${selectedFilter === option ? "active" : ""}`} onClick={() => setSelectedFilter(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <article className="group-create-card">
          <h2>Create a New Group</h2>
          <p className="intro">Set up a community with a description, default ITUKUAPP branding, group profile photo, cover photo and admin settings.</p>
          <form className="group-form" onSubmit={handleCreateGroup}>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="General">General</option>
              <option value="Youth">Youth</option>
              <option value="Business">Business</option>
              <option value="Culture">Culture</option>
            </select>
            <textarea
              placeholder="Write a clear group description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
            <div className="file-field">
              <label htmlFor="group-cover-upload">Group cover photo</label>
              <input
                id="group-cover-upload"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const image = await toDataUrl(file);
                  setCoverPhoto(image);
                }}
              />
            </div>
            <div className="file-field">
              <label htmlFor="group-profile-upload">Group profile photo</label>
              <input
                id="group-profile-upload"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const image = await toDataUrl(file);
                  setProfilePhoto(image);
                }}
              />
            </div>
            <button className="button button-small" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </button>
          </form>
          {error ? <p className="form-error" style={{ color: "#d9534f", marginTop: "0.75rem" }}>{error}</p> : null}
          {successMsg ? <p style={{ color: "#2e7d32", marginTop: "0.75rem", fontWeight: 700 }}>{successMsg}</p> : null}
        </article>

        <section className="group-grid">
          {filteredGroups.map((group) => (
            <article key={group.id} className="group-card">
              <Link href={`/groups/${group.slug || group.id}`} className="community-link">
              <img src={group.coverPhoto || defaultGroupCover} alt={`${group.name} cover`} className="group-cover" />
              <div className="group-card-body">
                <div className="group-card-head">
                  <img src={group.profilePhoto || defaultGroupProfile} alt={`${group.name} profile`} className="group-avatar" />
                  <span className="group-badge">{group.category}</span>
                </div>
                <h3>{group.name}</h3>
                <p>
                  <strong>{group.members}</strong> members
                </p>
                <div className="group-card-actions"><span className="read-more">Open community →</span><button type="button" className={followedGroups[group.id] ? "follow-button following" : "follow-button"} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleGroupFollow(group.id); }}>{followedGroups[group.id] ? "Following" : "Follow"}</button></div>
              </div>
              </Link>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
