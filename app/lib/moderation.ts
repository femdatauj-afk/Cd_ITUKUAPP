export type ModerationTarget = "group" | "community" | "page";
export type ModerationAction = "fine" | "suspend" | "ban";

export type AdminProfile = {
  id: string;
  name: string;
  title: string;
  position: string;
  entityType: ModerationTarget;
  entityName: string;
  isModerator: boolean;
  isAdmin: boolean;
  avatar: string;
  description: string;
};

export type ModerationEvent = {
  id: string;
  memberName: string;
  entityType: ModerationTarget;
  entityName: string;
  action: ModerationAction;
  amountCoins: number;
  durationLabel: string;
  reason: string;
  createdAt: string;
};

export const adminDirectory: AdminProfile[] = [
  {
    id: "group-admin-1",
    name: "Chinedu Henry",
    title: "Moderator",
    position: "Group Admin",
    entityType: "group",
    entityName: "Youth Circle",
    isModerator: true,
    isAdmin: true,
    avatar: "CH",
    description: "Manages rules, approvals and community welfare updates.",
  },
  {
    id: "group-admin-2",
    name: "Ada Okafor",
    title: "Moderator",
    position: "Youth Executive",
    entityType: "group",
    entityName: "Youth Circle",
    isModerator: true,
    isAdmin: true,
    avatar: "AO",
    description: "Coordinates youth programmes, event planning and checks.",
  },
  {
    id: "community-admin-1",
    name: "Eze Nwosu",
    title: "Village Chairman",
    position: "Community admin",
    entityType: "community",
    entityName: "Amokolo",
    isModerator: false,
    isAdmin: true,
    avatar: "EN",
    description: "Leads governance, approvals and community trust decisions.",
  },
  {
    id: "community-admin-2",
    name: "Martha Okafor",
    title: "Moderator",
    position: "Village Executive",
    entityType: "community",
    entityName: "Amokolo",
    isModerator: true,
    isAdmin: true,
    avatar: "MO",
    description: "Handles updates, welfare communication and issue review.",
  },
  {
    id: "page-admin-1",
    name: "Grace Bello",
    title: "Page Admin",
    position: "Moderator",
    entityType: "page",
    entityName: "Ituku Business Hub",
    isModerator: true,
    isAdmin: true,
    avatar: "GB",
    description: "Approves business updates, announcements and member issues.",
  },
  {
    id: "page-admin-2",
    name: "Ifeoma Dike",
    title: "Page Admin",
    position: "Executive",
    entityType: "page",
    entityName: "Community Secondary School Ituku CSSI Forum",
    isModerator: false,
    isAdmin: true,
    avatar: "ID",
    description: "Reviews school updates, moderation actions and community quality.",
  },
  {
    id: "support-admin-1",
    name: "Ituku Bolt Customer Service",
    title: "Platform Support",
    position: "Community support",
    entityType: "community",
    entityName: "ItukuApp Support",
    isModerator: true,
    isAdmin: true,
    avatar: "IB",
    description: "Operates the platform support queue, account validation and community guidance for the ItukuApp network.",
  },
  {
    id: "support-admin-2",
    name: "Ituku Bolt Customer Service",
    title: "Support moderator",
    position: "Group support",
    entityType: "group",
    entityName: "ItukuApp Operations",
    isModerator: true,
    isAdmin: true,
    avatar: "IB",
    description: "Helps manage operational escalations, onboarding checks and governance support across groups.",
  },
  {
    id: "support-admin-3",
    name: "Ituku Bolt Customer Service",
    title: "Page support",
    position: "Platform helpdesk",
    entityType: "page",
    entityName: "ItukuApp Help Desk",
    isModerator: true,
    isAdmin: true,
    avatar: "IB",
    description: "Supports platform follow-up, account verification help and moderation guidance for pages.",
  },
];

export const defaultModerationEvents: ModerationEvent[] = [
  {
    id: "event-1",
    memberName: "Kelechi Nnaji",
    entityType: "community",
    entityName: "Amokolo",
    action: "fine",
    amountCoins: 25,
    durationLabel: "No suspension",
    reason: "Repeated abusive comments in the community thread.",
    createdAt: "Today · 8:15 AM",
  },
  {
    id: "event-2",
    memberName: "Musa Nwachukwu",
    entityType: "group",
    entityName: "Women Market Forum",
    action: "suspend",
    amountCoins: 45,
    durationLabel: "3 months",
    reason: "Spam and repeated rule violations against other members.",
    createdAt: "Yesterday · 2:45 PM",
  },
];

export function rankPostsForFeed<T extends { likes: number; comments: number; shares: number }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aScore = a.likes * 2 + a.comments * 3 + a.shares * 4;
    const bScore = b.likes * 2 + b.comments * 3 + b.shares * 4;
    return bScore - aScore;
  });
}

export function canUserComment(joined: boolean) {
  return joined;
}

export function applyModerationAction(payload: {
  memberName: string;
  entityType: ModerationTarget;
  entityName: string;
  action: ModerationAction;
  amountCoins: number;
  durationLabel: string;
  reason: string;
}) {
  if (typeof window === "undefined") {
    return {
      ...payload,
      id: `local-${Date.now()}`,
      createdAt: "Just now",
    } satisfies ModerationEvent;
  }

  const existing = JSON.parse(localStorage.getItem("ituku-moderation-events") || "null") ?? defaultModerationEvents;
  const next: ModerationEvent[] = [
    {
      id: `event-${Date.now()}`,
      ...payload,
      createdAt: "Just now",
    },
    ...existing,
  ].slice(0, 12);

  localStorage.setItem("ituku-moderation-events", JSON.stringify(next));
  return next[0];
}

export function normalizeStorageKey(value: string) {
  return String(value || "ituku-user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "ituku-user";
}

export function addLocalNotification(userName: string, title: string, message: string) {
  if (typeof window === "undefined") return null;

  const key = `ituku-notifications-${normalizeStorageKey(userName)}`;
  const notification = {
    id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const next = [notification, ...Array.isArray(existing) ? existing : []].slice(0, 50);
  localStorage.setItem(key, JSON.stringify(next));

  const allKey = "ituku-notifications";
  const all = JSON.parse(localStorage.getItem(allKey) || "[]");
  localStorage.setItem(allKey, JSON.stringify([notification, ...Array.isArray(all) ? all : []].slice(0, 100)));

  return notification;
}

export function addEntityAnnouncement(entityType: ModerationTarget, entityName: string, message: string) {
  if (typeof window === "undefined") return null;

  const key = `ituku-entity-announcements-${entityType}-${normalizeStorageKey(entityName)}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const entry = {
    id: `announcement-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    entityType,
    entityName,
    message,
    createdAt: new Date().toISOString(),
  };

  const next = [entry, ...Array.isArray(existing) ? existing : []].slice(0, 20);
  localStorage.setItem(key, JSON.stringify(next));
  return entry;
}
