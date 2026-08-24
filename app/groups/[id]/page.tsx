"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { CommentThread } from "../../components/comment-thread";
import { EntityNavigation } from "../../components/entity-navigation";
import { addEntityAnnouncement, addLocalNotification, canUserComment, rankPostsForFeed } from "../../lib/moderation";

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
  status?: "Active" | "Restricted";
  fineDue?: number;
  friendshipStatus?: "pending" | "friend";
};

type GroupFine = { id: string; memberId: string; memberName: string; amount: number; reason: string; duration: string; status: "Unpaid" | "Paid" | "Appeal pending" | "Overturned" };

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

type GroupShare = { id: string; postId: string; target: string; taggedUsers: string[]; createdAt: string };
type GroupDashboardSection = "Details" | "Members" | "Notifications" | "Events" | "Photos" | "History";

type GroupPoll = {
  id: string;
  question: string;
  starts: string;
  ends: string;
  options: Array<{ id: string; label: string; votes: number }>;
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
  membersList: GroupMember[];
  posts: GroupPost[];
  polls: GroupPoll[];
  createdAt?: string;
  history?: Array<{ id: string; year: string; change: string }>;
  events?: Array<{ id: string; title: string; date: string; status: "Upcoming" | "Past" }>;
  photos?: string[];
  fines?: GroupFine[];
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
    polls: [],
    createdAt: "2024-03-12",
    history: [{ id: "history-g1-created", year: "2024", change: "Group created as Youth Circle." }],
    events: [{ id: "event-g1-workshop", title: "Productivity workshop", date: "Saturday, 24 Aug", status: "Upcoming" }],
    photos: [],
    fines: [],
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
    polls: [],
    createdAt: "2023-08-02",
    history: [{ id: "history-g2-created", year: "2023", change: "Group created as Women Market Forum." }],
    events: [],
    photos: [],
    fines: [],
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
    polls: [],
    createdAt: "2025-01-18",
    history: [{ id: "history-g3-created", year: "2025", change: "Group created as Community Development." }],
    events: [],
    photos: [],
    fines: [],
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
    return parsed.length ? parsed.map((group) => ({
      ...group,
      polls: group.polls || [],
      history: group.history || [{ id: `history-${group.id}`, year: "2024", change: `Group created as ${group.name}.` }],
      events: group.events || [],
      photos: group.photos || [],
      slug: group.slug || `${group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${group.id}`,
    })) : buildDefaultGroups();
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
  const [groups, setGroups] = useState<Group[]>(() => buildDefaultGroups());
  const [newRule, setNewRule] = useState("");
  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [shareMenuPostId, setShareMenuPostId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState("Feed");
  const [shareTags, setShareTags] = useState("");
  const [shares, setShares] = useState<GroupShare[]>([]);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<"details" | "admin">("details");
  const [dashboardSection, setDashboardSection] = useState<GroupDashboardSection>("Details");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleName>("moderator");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [joined, setJoined] = useState(true);
  const [followingGroup, setFollowingGroup] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [memberNotice, setMemberNotice] = useState("");
  const [pollComposerOpen, setPollComposerOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollStartDate, setPollStartDate] = useState("");
  const [pollStartTime, setPollStartTime] = useState("");
  const [pollEndDate, setPollEndDate] = useState("");
  const [pollEndTime, setPollEndTime] = useState("");
  const [fineComposerOpen, setFineComposerOpen] = useState(false);
  const [fineAmount, setFineAmount] = useState("25");
  const [fineReason, setFineReason] = useState("");
  const [fineDuration, setFineDuration] = useState("Until fine is paid");
  const [groupEditorOpen, setGroupEditorOpen] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [groupDescriptionDraft, setGroupDescriptionDraft] = useState("");
  const [groupCategoryDraft, setGroupCategoryDraft] = useState("");
  const groupCoverInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const group = useMemo(
    () => groups.find((item) => item.id === id || item.slug === id) ?? null,
    [groups, id],
  );

  useEffect(() => {
    setGroups(readGroupsFromStorage());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !id) return;
    try {
      const saved = JSON.parse(localStorage.getItem("ituku-followed-groups") || "{}");
      setFollowingGroup(Boolean(saved?.[id]));
    } catch {
      setFollowingGroup(false);
    }
  }, [id]);

  const toggleGroupFollow = () => {
    const raw = localStorage.getItem("ituku-followed-groups") || "{}";
    const saved = JSON.parse(raw);
    const next = { ...saved, [group?.id || id]: !followingGroup, ...(group?.slug ? { [group.slug]: !followingGroup } : {}) };
    localStorage.setItem("ituku-followed-groups", JSON.stringify(next));
    setFollowingGroup((current) => !current);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && groups.length) {
      localStorage.setItem("ituku-groups", JSON.stringify(groups));
    }
  }, [groups]);

  useEffect(() => {
    if (typeof window === "undefined" || !id) return;
    try {
      const stored = JSON.parse(localStorage.getItem(`ituku-group-shares-${id}`) || "[]");
      setShares(Array.isArray(stored) ? stored : []);
    } catch {
      setShares([]);
    }
  }, [id]);

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      localStorage.setItem(`ituku-group-shares-${id}`, JSON.stringify(shares));
    }
  }, [id, shares]);

  const rankedPosts = useMemo<GroupPost[]>(() => {
    if (!group) return [];

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

  const openGroupEditor = () => {
    setGroupNameDraft(group.name);
    setGroupDescriptionDraft(group.description);
    setGroupCategoryDraft(group.category);
    setGroupEditorOpen(true);
  };

  const saveGroupDetails = () => {
    const name = groupNameDraft.trim();
    const description = groupDescriptionDraft.trim();
    if (!name || !description) return;
    updateGroup((current) => ({ ...current, name, description, category: groupCategoryDraft }));
    setGroupEditorOpen(false);
  };

  const handleGroupImageChange = async (event: React.ChangeEvent<HTMLInputElement>, field: "profilePhoto" | "coverPhoto") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await toDataUrl(file);
    updateGroup((current) => ({ ...current, [field]: dataUrl }));
    event.target.value = "";
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

  const openFineComposer = (memberId = selectedMemberId) => {
    if (!memberId) {
      setMemberNotice("Select a member before issuing a fine.");
      return;
    }
    setSelectedMemberId(memberId);
    setFineComposerOpen(true);
    setFineReason("");
  };

  const selectedMember = group.membersList.find((member) => member.id === selectedMemberId);

  const submitFine = () => {
    if (!selectedMember || !fineReason.trim()) return;
    const amount = Number(fineAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const fine: GroupFine = { id: `fine-${Date.now()}`, memberId: selectedMember.id, memberName: selectedMember.name, amount, reason: fineReason.trim(), duration: fineDuration, status: "Unpaid" };
    const announcementMessage = `${selectedMember.name} was fined ${amount} coin in ${group.name} for: ${fineReason.trim()}. This is a public notice to the entire group.`;
    updateGroup((current) => ({
      ...current,
      fines: [fine, ...(current.fines || [])],
      membersList: current.membersList.map((member) => member.id === selectedMember.id ? { ...member, fineDue: (member.fineDue || 0) + amount, status: "Restricted" } : member),
    }));
    addLocalNotification(selectedMember.name, "Group fine issued", announcementMessage);
    addEntityAnnouncement("group", group.name, announcementMessage);
    setFineComposerOpen(false);
    setMemberNotice(`${selectedMember.name} is restricted in ${group.name} until the ${amount} coin fine is settled.`);
  };

  const updateFineStatus = (fineId: string, status: GroupFine["status"]) => {
    const fine = (group.fines || []).find((item) => item.id === fineId);
    updateGroup((current) => ({
      ...current,
      fines: (current.fines || []).map((item) => item.id === fineId ? { ...item, status } : item),
      membersList: status === "Paid" || status === "Overturned" ? current.membersList.map((member) => member.id === fine?.memberId ? { ...member, fineDue: Math.max(0, (member.fineDue || 0) - (fine?.amount || 0)), status: "Active" } : member) : current.membersList,
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

  const handleAddPost = () => {
    if (!joined) {
      setMemberNotice("Join the group before posting an update.");
      window.setTimeout(() => setMemberNotice(""), 2200);
      return;
    }
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

  const handleShare = (postId: string) => {
    const taggedUsers = shareTags.split(",").map((name) => name.trim()).filter(Boolean);
    const share: GroupShare = { id: `share-${Date.now()}`, postId, target: shareTarget, taggedUsers, createdAt: new Date().toISOString() };
    setShares((current) => [share, ...current]);
    setShareNotice(`Shared to ${shareTarget}${taggedUsers.length ? ` and tagged ${taggedUsers.join(", ")}` : ""}.`);
    setShareMenuPostId(null);
    setShareTags("");
    window.setTimeout(() => setShareNotice(""), 2200);
  };

  const handleLike = (postId: string) => {
    const likedPosts = JSON.parse(localStorage.getItem("ituku-liked-posts") || "[]");
    if (Array.isArray(likedPosts) && likedPosts.includes(postId)) {
      updateGroup((current) => ({
        ...current,
        posts: current.posts.map((post) => post.id === postId ? { ...post, likes: Math.max(0, post.likes - 1) } : post),
      }));
      localStorage.setItem("ituku-liked-posts", JSON.stringify(likedPosts.filter((id: string) => id !== postId)));
      return;
    }

    updateGroup((current) => ({
      ...current,
      posts: current.posts.map((post) => post.id === postId ? { ...post, likes: post.likes + 1 } : post),
    }));

    localStorage.setItem("ituku-liked-posts", JSON.stringify(Array.isArray(likedPosts) ? [...likedPosts, postId] : [postId]));
  };

  const deleteComment = (postId: string, commentId: string) => {
    updateGroup((current) => ({
      ...current,
      posts: current.posts.map((post) => post.id !== postId ? post : { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }),
    }));
  };

  const deletePost = (postId: string) => {
    updateGroup((current) => ({ ...current, posts: current.posts.filter((post) => post.id !== postId) }));
    setShares((current) => current.filter((share) => share.postId !== postId));
  };

  const deleteShare = (shareId: string) => {
    setShares((current) => current.filter((share) => share.id !== shareId));
  };

  const openDashboard = (mode: "details" | "admin") => {
    setDashboardMode(mode);
    setDashboardSection("Details");
    setDashboardOpen(true);
  };

  const createEvent = () => {
    if (!eventTitle.trim() || !eventDate.trim()) return;
    updateGroup((current) => ({ ...current, events: [{ id: `event-${Date.now()}`, title: eventTitle.trim(), date: eventDate.trim(), status: "Upcoming" }, ...(current.events || [])] }));
    setEventTitle("");
    setEventDate("");
  };

  const publishPoll = () => {
    const question = pollQuestion.trim();
    const options = pollOptions.filter((option) => option.trim());
    if (!question || options.length < 2) return;

    const startText = `${pollStartDate || "Today"}${pollStartTime ? ` at ${pollStartTime}` : ""}`;
    const endText = `${pollEndDate || "7 days from now"}${pollEndTime ? ` at ${pollEndTime}` : ""}`;
    const poll: GroupPoll = {
      id: `poll-${Date.now()}`,
      question,
      starts: startText,
      ends: endText,
      options: options.map((label, index) => ({ id: `option-${index}`, label: label.trim(), votes: 0 })),
    };

    updateGroup((current) => ({ ...current, polls: [poll, ...(current.polls || [])] }));
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollStartDate("");
    setPollStartTime("");
    setPollEndDate("");
    setPollEndTime("");
    setPollComposerOpen(false);
    setMemberNotice("Poll published to the group.");
    window.setTimeout(() => setMemberNotice(""), 2200);
  };

  const handleVote = (pollId: string, optionId: string) => {
    const votedPolls = JSON.parse(localStorage.getItem("ituku-voted-polls") || "[]");
    if (Array.isArray(votedPolls) && votedPolls.includes(pollId)) {
      setMemberNotice("You can vote once per poll.");
      window.setTimeout(() => setMemberNotice(""), 2200);
      return;
    }

    updateGroup((current) => ({
      ...current,
      polls: (current.polls || []).map((poll) => poll.id !== pollId ? poll : {
        ...poll,
        options: poll.options.map((option) => option.id === optionId ? { ...option, votes: option.votes + 1 } : option),
      }),
    }));
    localStorage.setItem("ituku-voted-polls", JSON.stringify(Array.isArray(votedPolls) ? [...votedPolls, pollId] : [pollId]));
  };

  const handleMemberAction = (action: "friend" | "message", personName: string, memberId?: string) => {
    if (!memberId) {
      setMemberNotice(action === "friend" ? `Friend request sent to ${personName}.` : `Message opened for ${personName}.`);
      window.setTimeout(() => setMemberNotice(""), 2200);
      return;
    }

    if (action === "friend") {
      updateGroup((current) => ({
        ...current,
        membersList: current.membersList.map((member) =>
          member.id === memberId ? { ...member, friendshipStatus: "friend" } : member,
        ),
      }));

      const friends = JSON.parse(localStorage.getItem("ituku-friends") || "[]");
      const nextFriends = friends.some((friend: { id: string }) => friend.id === memberId)
        ? friends
        : [...friends, { id: memberId, name: personName }];
      localStorage.setItem("ituku-friends", JSON.stringify(nextFriends));
      setMemberNotice(`${personName} was added to your friends.`);
      window.setTimeout(() => setMemberNotice(""), 2400);
      return;
    }

    localStorage.setItem("ituku-open-chat-user", JSON.stringify({ id: memberId, name: personName }));
    window.location.href = "/chat";
  };

  return (
    <AppShell title={group.name} subtitle={group.description}>
      <EntityNavigation basePath={`/groups/${id}`} active="Overview" manageHref={`/groups/admins?group=${encodeURIComponent(group.name)}`} />
      <style jsx global>{`
        .group-detail-page { display: grid; gap: 1.2rem; }
        .group-header-card { background: #fff; border: 1px solid #e6ece6; border-radius: 26px; overflow: hidden; box-shadow: 0 12px 28px rgba(17, 54, 34, 0.08); }
        .group-cover-wrap { position: relative; min-height: 310px; display: flex; align-items: flex-end; background: #173c2a; }
        .group-cover { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .group-cover-wrap::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8, 18, 13, 0.04) 18%, rgba(8, 18, 13, 0.2) 45%, rgba(8, 18, 13, 0.9) 100%); }
        .group-cover-content { position: relative; z-index: 1; width: min(100%, 920px); padding: 32px 28px 26px; color: #fff; }
        .group-cover-content h1 { max-width: 760px; margin: 0; color: #fff; font-size: clamp(2rem, 5vw, 4rem); line-height: 0.98; letter-spacing: -0.045em; text-shadow: 0 2px 18px rgba(0, 0, 0, 0.48); overflow-wrap: anywhere; }
        .group-cover-content p { margin: 12px 0 0; color: rgba(255, 255, 255, 0.96); font-weight: 700; text-shadow: 0 1px 10px rgba(0, 0, 0, 0.65); }
        .group-cover-kicker { margin: 0 0 10px !important; color: #d9f27d !important; font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; }
        .group-detail-body { padding: 1rem 1.4rem 1.35rem; }
        .group-profile-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .group-avatar-wrap { display: block; }
        .group-header-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: flex-end; }
        .group-editor { display: grid; gap: 0.8rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e6ece6; }
        .group-editor input, .group-editor textarea, .group-editor select { width: 100%; border: 1px solid #dfe9e0; border-radius: 12px; padding: 0.8rem 0.9rem; font: inherit; background: white; }
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
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .share-menu { margin-top: 0.6rem; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
        .share-dialog { display: grid; gap: 0.7rem; padding: 0.8rem; border: 1px solid #dce9df; border-radius: 14px; background: #f7fbf8; }
        .share-dialog select, .share-dialog input { width: 100%; border: 1px solid #dfe9e0; border-radius: 10px; padding: 0.65rem 0.75rem; font: inherit; background: #fff; }
        .share-record { display: flex; justify-content: space-between; gap: 0.8rem; align-items: center; padding: 0.7rem; border: 1px solid #e6ece7; border-radius: 12px; background: #fbfdfb; }
        .dashboard-overlay { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 1rem; background: rgba(8, 20, 13, 0.58); }
        .dashboard-modal { width: min(100%, 960px); max-height: min(88vh, 820px); overflow: auto; background: #fff; border-radius: 22px; padding: 1.2rem; box-shadow: 0 24px 70px rgba(0,0,0,.24); }
        .dashboard-nav { display: flex; gap: .5rem; flex-wrap: wrap; margin: 1rem 0; padding-bottom: .8rem; border-bottom: 1px solid #e7eee8; }
        .dashboard-nav button { border: 1px solid #dfe9e0; border-radius: 999px; background: #fff; padding: .55rem .8rem; font-weight: 700; cursor: pointer; }
        .dashboard-nav button.active { background: #0e6d3e; color: #fff; border-color: #0e6d3e; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; }
        .dashboard-tile { border: 1px solid #e5ece6; border-radius: 14px; padding: .85rem; background: #f8fbf8; }
        .share-option { border: 1px solid #e8edf1; background: #fff; border-radius: 12px; padding: 0.6rem 0.7rem; cursor: pointer; }
        .notice { color: #0c6b3d; font-weight: 700; }
        .action-dialog { display: grid; gap: 10px; padding: 16px; border: 1px solid #dce9df; border-radius: 16px; background: #f7fbf8; }
        .action-dialog input, .action-dialog select, .action-dialog textarea { width: 100%; border: 1px solid #dfe9e0; border-radius: 10px; padding: 10px 12px; font: inherit; background: #fff; }
        .section-stack { display: grid; gap: 1rem; }
        .poll-list { display: grid; gap: 0.8rem; }
        .poll-card { border: 1px solid #e9efeb; border-radius: 16px; background: #f9fcfa; padding: 0.9rem; display: grid; gap: 0.7rem; }
        .poll-card h4 { margin: 0; color: #24382c; }
        .poll-meta { color: #617267; font-size: 0.78rem; }
        .poll-option { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; border: 1px solid #e2ebe3; border-radius: 10px; padding: 0.55rem 0.65rem; background: #fff; }
        @media (max-width: 820px) {
          .group-layout { grid-template-columns: 1fr; }
          .group-cover-wrap { min-height: 270px; }
          .group-cover-content { padding: 26px 20px 22px; }
          .group-profile-row { align-items: flex-start; flex-direction: column; }
          .group-header-actions { justify-content: flex-start; }
        }
      `}</style>

      <div className="group-detail-page">
        {memberNotice ? <div className="notice" role="status">{memberNotice}</div> : null}
        {dashboardOpen ? <div className="dashboard-overlay" role="presentation" onClick={() => setDashboardOpen(false)}><section className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="group-dashboard-title" onClick={(event) => event.stopPropagation()}>
          <div className="post-actions" style={{ justifyContent: "space-between" }}><div><p className="section-title" style={{ marginBottom: 4 }}>GROUP DASHBOARD</p><h2 id="group-dashboard-title" style={{ margin: 0 }}>{group.name}</h2></div><button type="button" className="action-btn" onClick={() => setDashboardOpen(false)}>Close</button></div>
          {dashboardMode === "admin" ? <div className="notice" style={{ marginTop: 12 }}>Admin controls are private to group managers.</div> : <div className="intro" style={{ marginTop: 12 }}>Group details and member information.</div>}
          {dashboardMode === "details" ? <>
            <div className="dashboard-nav">{(["Details", "Members", "Notifications", "Events", "Photos", "History"] as GroupDashboardSection[]).map((section) => <button key={section} type="button" className={dashboardSection === section ? "active" : ""} onClick={() => setDashboardSection(section)}>{section}</button>)}</div>
            {dashboardSection === "Details" ? <div className="dashboard-grid"><div className="dashboard-tile"><strong>About</strong><p>{group.description}</p></div><div className="dashboard-tile"><strong>Group type</strong><p>{group.category} · Public group</p></div><div className="dashboard-tile"><strong>Members</strong><p>{group.members.toLocaleString()} members · <button type="button" className="text-link" onClick={() => setDashboardSection("Members")}>See all</button></p></div><div className="dashboard-tile"><strong>Pages</strong><p>Community pages connected to this group · <Link className="text-link" href="/pages">See all</Link></p></div></div> : null}
            {dashboardSection === "Members" ? <div className="section-stack"><input className="rule-input" placeholder="Search members" /><div className="dashboard-grid"><div className="dashboard-tile"><strong>Admins and moderators</strong>{group.membersList.filter((member) => member.role === "admin" || member.role === "moderator").map((member) => <p key={member.id}>{member.name} · {member.role}</p>)}</div><div className="dashboard-tile"><strong>Things in common</strong><p>You are both connected to ItukuApp community spaces.</p><strong>Recently joined</strong>{group.membersList.slice(-2).map((member) => <p key={member.id}>{member.name}</p>)}</div></div><button type="button" className="join-btn" onClick={() => setMemberNotice("Member directory opened.")}>See all members</button></div> : null}
            {dashboardSection === "Notifications" ? <div className="dashboard-tile"><strong>Notification preferences</strong><p>Choose the group updates you want to see: friends&apos; posts, all posts, or highlights.</p><div className="post-actions"><button type="button" className="action-btn" onClick={() => setMemberNotice("Notifications set to friends&apos; posts.")}>Friends&apos; posts</button><button type="button" className="action-btn" onClick={() => setMemberNotice("Notifications set to all posts.")}>All posts</button><button type="button" className="action-btn" onClick={() => setMemberNotice("Notifications set to highlights.")}>Highlights</button></div></div> : null}
            {dashboardSection === "Events" ? <div className="section-stack"><div className="dashboard-grid">{(group.events || []).map((event) => <div key={event.id} className="dashboard-tile"><strong>{event.title}</strong><p>{event.date} · {event.status}</p></div>)}</div><input className="rule-input" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Create event title" /><input className="rule-input" value={eventDate} onChange={(event) => setEventDate(event.target.value)} placeholder="Event date and time" /><button type="button" className="join-btn" onClick={createEvent}>Create event</button></div> : null}
            {dashboardSection === "Photos" ? <div className="dashboard-tile"><strong>Photos</strong><p>{(group.photos || []).length ? `${group.photos?.length} photos in this group.` : "No group photos yet."}</p></div> : null}
            {dashboardSection === "History" ? <div className="dashboard-grid">{(group.history || []).map((entry) => <div key={entry.id} className="dashboard-tile"><strong>{entry.year}</strong><p>{entry.change}</p></div>)}</div> : null}
          </> : <div className="dashboard-grid" style={{ marginTop: 16 }}><div className="dashboard-tile"><strong>Group identity</strong><p>Edit name, description, category, and cover photo.</p><button type="button" className="join-btn" onClick={() => { setDashboardOpen(false); openGroupEditor(); }}>Edit group</button></div><div className="dashboard-tile"><strong>Moderation</strong><p>Manage roles, rules, fines, polls, and member restrictions.</p><button type="button" className="join-btn" onClick={() => { setDashboardOpen(false); document.getElementById("members")?.scrollIntoView({ behavior: "smooth" }); }}>Open controls</button></div></div>}
        </section></div> : null}
        {fineComposerOpen ? (
          <div className="action-dialog">
            <strong>Issue a group fine</strong>
            <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
              {group.membersList.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
            <input type="number" min="1" value={fineAmount} onChange={(event) => setFineAmount(event.target.value)} placeholder="Fine amount in coin" />
            <select value={fineDuration} onChange={(event) => setFineDuration(event.target.value)}><option>Until fine is paid</option><option>2 weeks</option><option>3 months</option><option>1 year</option></select>
            <textarea value={fineReason} onChange={(event) => setFineReason(event.target.value)} placeholder="Reason for the fine" rows={3} />
            <div className="post-actions"><button type="button" className="join-btn" onClick={submitFine}>Issue fine</button><button type="button" className="action-btn" onClick={() => setFineComposerOpen(false)}>Cancel</button></div>
          </div>
        ) : null}
        <section className="group-header-card">
          <div className="group-cover-wrap">
            <img src={group.coverPhoto || defaultGroupCover} alt={`${group.name} cover`} className="group-cover" />
            <div className="group-cover-content">
              <p className="group-cover-kicker">Public group</p>
              <h1>{group.name}</h1>
              <p><strong>{group.members.toLocaleString()}</strong> members · {group.category}</p>
            </div>
          </div>
          <div className="group-detail-body">
            <div className="group-profile-row">
              <div className="group-avatar-wrap">
                <p className="intro" style={{ margin: 0 }}>{group.description}</p>
              </div>
              <div className="group-header-actions">
                <button className="action-btn" type="button" onClick={() => openDashboard("admin")}>Dashboard</button>
                <button className="action-btn" type="button" onClick={() => openDashboard("details")}>Group details</button>
                <button className={followingGroup ? "join-btn following-group" : "join-btn"} type="button" onClick={toggleGroupFollow}>{followingGroup ? "Following" : "Follow group"}</button>
                <button className="join-btn" type="button" onClick={() => setJoined((value) => !value)}>
                  {joined ? "Joined ✓" : "Join group"}
                </button>
              </div>
            </div>
            {groupEditorOpen ? (
              <div className="group-editor">
                <strong>Edit group identity</strong>
                <input value={groupNameDraft} onChange={(event) => setGroupNameDraft(event.target.value)} placeholder="Group name" />
                <select value={groupCategoryDraft} onChange={(event) => setGroupCategoryDraft(event.target.value)}>
                  <option>General</option>
                  <option>Youth</option>
                  <option>Business</option>
                  <option>Culture</option>
                </select>
                <textarea value={groupDescriptionDraft} onChange={(event) => setGroupDescriptionDraft(event.target.value)} placeholder="Group description" rows={3} />
                <div className="post-actions">
                  <input ref={groupCoverInputRef} type="file" accept="image/*" hidden onChange={(event) => handleGroupImageChange(event, "coverPhoto")} />
                  <button className="action-btn" type="button" onClick={() => groupCoverInputRef.current?.click()}>Upload cover photo</button>
                  <button className="join-btn" type="button" onClick={saveGroupDetails}>Save changes</button>
                  <button className="action-btn" type="button" onClick={() => setGroupEditorOpen(false)}>Cancel</button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="group-layout">
          <div className="section-stack">
            <section className="panel-card">
              <h3 className="section-title">About this group</h3>
              <p className="intro">{group.description}</p>
            </section>

            <section id="posts" className="panel-card">
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
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
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
                  <button type="button" className="action-btn" onClick={() => mediaInputRef.current?.click()}>Add photo</button>
                  <button type="button" className="action-btn" onClick={handleAddPost} disabled={!joined}>Post update</button>
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
                      post.media.startsWith("data:image/") ? (
                        <img src={post.media} alt="Shared group media" className="post-media" />
                      ) : (
                        <video controls src={post.media} className="post-media" />
                      )
                    ) : null}
                    <div className="post-actions-row">
                      <button type="button" className="action-btn" onClick={() => handleLike(post.id)}>
                        👍 {JSON.parse(typeof window === "undefined" ? "[]" : localStorage.getItem("ituku-liked-posts") || "[]").includes(post.id) ? "Unlike" : "Like"} ({post.likes})
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        aria-expanded={shareMenuPostId === post.id}
                        onClick={() => setShareMenuPostId((current) => (current === post.id ? null : post.id))}
                      >
                        ↗ Share
                      </button>
                    </div>

                      {shareMenuPostId === post.id ? (
                        <div className="share-menu">
                          <div className="share-dialog">
                            <select value={shareTarget} onChange={(event) => setShareTarget(event.target.value)} aria-label="Share destination">
                              {shareOptions.map((option) => <option key={option}>{option}</option>)}
                            </select>
                            <input value={shareTags} onChange={(event) => setShareTags(event.target.value)} placeholder="Tag users, separated by commas" aria-label="Tag users" />
                            <button type="button" className="join-btn" onClick={() => handleShare(post.id)}>Share now</button>
                          </div>
                        </div>
                      ) : null}

                    {shareNotice ? <div className="notice">{shareNotice}</div> : null}

                    <CommentThread postId={post.id} basePath={`/groups/${encodeURIComponent(id)}/posts/${encodeURIComponent(post.id)}/comments`} />
                    {post.author === "You" ? <button type="button" className="action-btn" onClick={() => deletePost(post.id)}>Delete post</button> : null}
                  </article>
                ))}
              </div>
            </section>

            {shares.length > 0 ? <section className="panel-card"><h3 className="section-title">Your shares</h3><div className="group-rules">{shares.map((share) => <div key={share.id} className="share-record"><span>Shared to <strong>{share.target}</strong>{share.taggedUsers.length ? ` · tagged ${share.taggedUsers.join(", ")}` : ""}</span><button type="button" className="action-btn" onClick={() => deleteShare(share.id)}>Delete share</button></div>)}</div></section> : null}

            <section id="polls" className="panel-card">
              <div className="post-actions" style={{ justifyContent: "space-between" }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>Group polls</h3>
                <button type="button" className="join-btn" onClick={() => setPollComposerOpen((current) => !current)}>Create poll</button>
              </div>
              {pollComposerOpen ? (
                <div className="action-dialog" style={{ marginTop: "1rem" }}>
                  <input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Ask the group a question" />
                  <div className="post-actions">
                    <input type="date" value={pollStartDate} onChange={(event) => setPollStartDate(event.target.value)} aria-label="Poll start date" />
                    <input type="time" value={pollStartTime} onChange={(event) => setPollStartTime(event.target.value)} aria-label="Poll start time" />
                  </div>
                  <div className="post-actions">
                    <input type="date" value={pollEndDate} onChange={(event) => setPollEndDate(event.target.value)} aria-label="Poll end date" />
                    <input type="time" value={pollEndTime} onChange={(event) => setPollEndTime(event.target.value)} aria-label="Poll end time" />
                  </div>
                  {pollOptions.map((option, index) => <input key={index} value={option} onChange={(event) => setPollOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Choice ${index + 1}`} />)}
                  <div className="post-actions"><button type="button" className="join-btn" onClick={publishPoll}>Publish poll</button><button type="button" className="action-btn" onClick={() => setPollComposerOpen(false)}>Cancel</button></div>
                </div>
              ) : null}
              <div className="poll-list" style={{ marginTop: "1rem" }}>
                {(group.polls || []).length === 0 ? <p className="intro">No polls yet. Create one for members to vote immediately.</p> : null}
                {(group.polls || []).map((poll) => (
                  <div key={poll.id} className="poll-card">
                    <h4>{poll.question}</h4>
                    <div className="poll-meta">Starts: {poll.starts} · Ends: {poll.ends}</div>
                    {poll.options.map((option) => <div key={option.id} className="poll-option"><span>{option.label}</span><button type="button" className="action-btn" onClick={() => handleVote(poll.id, option.id)}>Vote ({option.votes})</button></div>)}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="section-stack">
            <section id="members" className="panel-card">
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
                    {member.status === "Restricted" ? <div className="meta-pill">Restricted · {member.fineDue || 0} coin due</div> : null}
                    <div className="post-actions">
                      <button type="button" className="action-btn" onClick={() => handleMemberAction("friend", member.name, member.id)}>{member.friendshipStatus === "friend" ? "Friend ✓" : "Add friend"}</button>
                      <button type="button" className="action-btn" onClick={() => handleMemberAction("message", member.name, member.id)}>Message</button>
                      <button type="button" className="action-btn" onClick={() => openFineComposer(member.id)}>Fine</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="settings" className="panel-card">
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
            {(group.fines || []).length > 0 ? <section className="panel-card"><h3 className="section-title">Fine and appeal register</h3><div className="group-rules">{(group.fines || []).map((fine) => <div key={fine.id} className="rule-item"><strong>{fine.memberName}</strong> · {fine.amount} coin · {fine.reason} · {fine.status}<div className="post-actions">{fine.status === "Unpaid" ? <button type="button" className="action-btn" onClick={() => updateFineStatus(fine.id, "Appeal pending")}>Appeal</button> : null}{fine.status === "Unpaid" ? <button type="button" className="action-btn" onClick={() => updateFineStatus(fine.id, "Paid")}>Mark paid</button> : null}{fine.status === "Appeal pending" ? <button type="button" className="action-btn" onClick={() => updateFineStatus(fine.id, "Overturned")}>Uphold appeal</button> : null}</div></div>)}</div></section> : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
