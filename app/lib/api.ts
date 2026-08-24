const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const buildApiUrl = (path: string) => {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, '')}${safePath}`;
};

export type ProfileSettings = {
  privacy: {
    profile: string;
    follow: string;
    message: string;
    comments: string;
    tag: string;
    mention: string;
    followers: string;
    following: string;
  };
  notifications: Record<string, boolean>;
  appearance: {
    theme: string;
    textSize: string;
    reduceAnimations: boolean;
    language: string;
  };
};

export const defaultProfileSettings: ProfileSettings = {
  privacy: {
    profile: 'Everyone',
    follow: 'Everyone',
    message: 'Friends/Followers',
    comments: 'Everyone',
    tag: 'Friends/Followers',
    mention: 'Everyone',
    followers: 'Everyone',
    following: 'People I follow',
  },
  notifications: {
    likes: true,
    comments: true,
    newFollowers: true,
    mentions: true,
    messages: true,
    groupActivity: true,
    pageActivity: true,
    communityAnnouncements: true,
    events: true,
    coinTransactions: true,
    pushNotifications: true,
  },
  appearance: {
    theme: 'System Default',
    textSize: 'Medium',
    reduceAnimations: true,
    language: 'English',
  },
};

const seededDeveloperUser = {
  id: 'developer-seeded-user',
  email: 'henry4683328@gmail.com',
  username: 'Henry-Of-Ituku',
  password: 'slimkid0042',
  fullName: 'Chinedu Henry Ujam',
  village: 'Umukulu',
  phone: '08142229477',
  sex: 'male',
  dateOfBirth: '1995-05-25',
  bio: 'Verified founder and lead developer of ItukuApp. Building a stronger, more connected Ituku community through technology and trust.',
  role: 'developer',
  isVerified: true,
  isActive: true,
  verificationStatus: 'active',
  phoneVerified: true,
  emailVerified: true,
  verifiedBadge: 'ItukuApp Verified',
  usernameUpdatedAt: '2025-01-01T00:00:00.000Z',
  walletBalance: 1000000,
};

const seededSocialUsers = [
  { email: 'amina.ede@ituku.app', username: 'AminaEde', password: 'slimkid0042', fullName: 'Amina Ede', village: 'Umukulu', phone: '08030010001', sex: 'female', bio: 'Community leader focused on youth growth and education.', role: 'moderator', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'tochukwu.agwu@ituku.app', username: 'TochukwuAgwu', password: 'slimkid0042', fullName: 'Tochukwu Agwu', village: 'Umukulu', phone: '08030010002', sex: 'male', bio: 'Volunteer mentor and event organizer.', role: 'moderator', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'nneka.egbu@ituku.app', username: 'NnekaEgbu', password: 'slimkid0042', fullName: 'Nneka Egbu', village: 'Ugwunagbo', phone: '08030010003', sex: 'female', bio: 'Village project coordinator and civic advocate.', role: 'moderator', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'chima.okafor@ituku.app', username: 'ChimaOkafor', password: 'slimkid0042', fullName: 'Chima Okafor', village: 'Okwenachala', phone: '08030010004', sex: 'male', bio: 'Community organizer and local development advocate.', role: 'moderator', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'ada.okoye@ituku.app', username: 'AdaOkoye', password: 'slimkid0042', fullName: 'Ada Okoye', village: 'Ugwunagbo', phone: '08030010005', sex: 'female', bio: 'Youth chairman creating safe spaces for local engagement.', role: 'moderator', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'ifeoma.eze@ituku.app', username: 'IfeomaEze', password: 'slimkid0042', fullName: 'Ifeoma Eze', village: 'Amokolo', phone: '08030010006', sex: 'female', bio: 'Mentor and digital literacy volunteer.', role: 'member', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'kelechi.nnaji@ituku.app', username: 'KelechiNnaji', password: 'slimkid0042', fullName: 'Kelechi Nnaji', village: 'Amokolo', phone: '08030010007', sex: 'male', bio: 'Community member passionate about local commerce.', role: 'member', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'rose.nwoko@ituku.app', username: 'RoseNwoko', password: 'slimkid0042', fullName: 'Rose Nwoko', village: 'Umukulu', phone: '08030010008', sex: 'female', bio: 'Supports family wellbeing and community care programs.', role: 'member', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'musa.nwachukwu@ituku.app', username: 'MusaNwachukwu', password: 'slimkid0042', fullName: 'Musa Nwachukwu', village: 'Umukulu', phone: '08030010009', sex: 'male', bio: 'Student and community volunteer', role: 'member', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
  { email: 'ituku.bolt@ituku.app', username: 'ItukuBolt', password: 'slimkid0042', fullName: 'Ituku Bolt Customer Service', village: 'ItukuHQ', phone: '08030010010', sex: 'other', bio: 'Platform operations and backend support account.', role: 'admin', isVerified: true, isActive: true, verificationStatus: 'active', phoneVerified: true, emailVerified: true, verifiedBadge: 'ItukuApp Verified', walletBalance: 1000000 },
];

function getLocalUsers(): Array<Record<string, any>> {
  if (typeof window === 'undefined') return [];

  const raw = localStorage.getItem('ituku-local-users');
  if (!raw) {
    localStorage.setItem('ituku-local-users', JSON.stringify([seededDeveloperUser]));
    return [seededDeveloperUser];
  }

  try {
    const parsed = JSON.parse(raw);
    const hasDeveloper = parsed.some((user: Record<string, any>) => user.email === seededDeveloperUser.email || user.username === seededDeveloperUser.username);
    if (!hasDeveloper) {
      const next = [...parsed, seededDeveloperUser];
      localStorage.setItem('ituku-local-users', JSON.stringify(next));
      return next;
    }
    return parsed;
  } catch {
    localStorage.setItem('ituku-local-users', JSON.stringify([seededDeveloperUser]));
    return [seededDeveloperUser];
  }
}

function persistLocalUsers(users: Array<Record<string, any>>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ituku-local-users', JSON.stringify(users));
}

export function ensureSeededUsers() {
  if (typeof window === 'undefined') return [seededDeveloperUser, ...seededSocialUsers.map((user, index) => ({ id: `seed-user-${index + 1}`, ...user }))];

  const users = getLocalUsers();
  const seeded = [seededDeveloperUser, ...seededSocialUsers.map((user, index) => ({ id: `seed-user-${index + 1}`, ...user }))];
  const merged = [...users];

  for (const user of seeded) {
    const existing = merged.find((entry) => entry.email === user.email || entry.username === user.username);
    if (!existing) {
      merged.push(user);
    }
  }

  if (merged.length !== users.length) {
    persistLocalUsers(merged);
  }

  return merged;
}

export function getSeededUsers() {
  const users = ensureSeededUsers();
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    village: user.village,
    phone: user.phone,
    bio: user.bio,
    role: user.role,
    isVerified: user.isVerified,
    verifiedBadge: user.verifiedBadge,
    walletBalance: user.walletBalance ?? 1000000,
    password: user.password,
  }));
}

export async function fetchCommunityUsers(query = '') {
  if (typeof window !== 'undefined' && !getSession()?.token) {
    return getSeededUsers().filter((user) => {
      const needle = query.trim().toLowerCase();
      return !needle || `${user.fullName} ${user.username}`.toLowerCase().includes(needle);
    });
  }

  try {
    const endpoint = query ? `/users/directory?q=${encodeURIComponent(query)}` : '/users/directory';
    const users = await request<Array<Record<string, any>>>(endpoint);

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      village: user.village,
      phone: user.phone,
      bio: user.bio,
      role: user.role || 'member',
      isVerified: user.isVerified ?? true,
      verifiedBadge: user.verifiedBadge || 'ItukuApp Verified',
      walletBalance: user.walletBalance ?? 1000000,
      password: '',
    }));
  } catch {
    return getSeededUsers();
  }
}

export function getMarketplaceListings() {
  if (typeof window === 'undefined') return [
    { id: 'mkt-1', title: 'Fresh yam tubers', price: 8500, seller: 'Ngozi', sellerUsername: 'KelechiNnaji', sellerId: 'seed-user-7', sellerPhoto: '', sellerVerified: true, location: 'Amokolo market', category: 'Food', description: 'Cleanly harvested yam tubers sold in bundles for home use and wholesale.', badge: 'Featured' },
    { id: 'mkt-2', title: 'Handmade woven basket', price: 3200, seller: 'Ify', sellerUsername: 'RoseNwoko', sellerId: 'seed-user-8', sellerPhoto: '', sellerVerified: true, location: 'Umukulu arts hub', category: 'Handcraft', description: 'Beautiful woven basket made by local artisans.', badge: 'New' },
    { id: 'mkt-3', title: 'Phone repair service', price: 2000, seller: 'Moses', sellerUsername: 'MusaNwachukwu', sellerId: 'seed-user-9', sellerPhoto: '', sellerVerified: true, location: 'Central town', category: 'Services', description: 'Fast phone screen and charging port repair with same-day service.', badge: 'Popular' },
  ];

  const raw = localStorage.getItem('ituku-marketplace-listings');
  if (!raw) {
    const defaults = [
      { id: 'mkt-1', title: 'Fresh yam tubers', price: 8500, seller: 'Ngozi', location: 'Amokolo market', category: 'Food', description: 'Cleanly harvested yam tubers sold in bundles for home use and wholesale.', badge: 'Featured' },
      { id: 'mkt-2', title: 'Handmade woven basket', price: 3200, seller: 'Ify', location: 'Umukulu arts hub', category: 'Handcraft', description: 'Beautiful woven basket made by local artisans.', badge: 'New' },
      { id: 'mkt-3', title: 'Phone repair service', price: 2000, seller: 'Moses', location: 'Central town', category: 'Services', description: 'Fast phone screen and charging port repair with same-day service.', badge: 'Popular' },
      { id: 'mkt-4', title: 'School supplies bundle', price: 5400, seller: 'Amina', location: 'Ugwunagbo', category: 'Education', description: 'Bundle of notebooks, books, and school stationery for new term readiness.', badge: 'Trusted' },
    ];
    localStorage.setItem('ituku-marketplace-listings', JSON.stringify(defaults));
    return defaults;
  }

  try {
    const pages = JSON.parse(raw);
    if (!Array.isArray(pages) || pages.length === 0) {
      const defaults = [
        { id: 'seed-page-1', name: 'Ituku Business Hub', category: 'Business', followers: 812 },
        { id: 'seed-page-2', name: 'Catholic Youth Organization of Nigeria CYON', category: 'Church', followers: 460 },
        { id: 'seed-page-3', name: 'Community Secondary School Ituku CSSI Forum', category: 'School', followers: 221 },
      ];
      localStorage.setItem('ituku-community-pages', JSON.stringify(defaults));
      return defaults;
    }
    return pages;
  } catch {
    localStorage.removeItem('ituku-marketplace-listings');
    return getMarketplaceListings();
  }
}

export async function fetchMarketplaceListings() {
  try {
    const listings = await request<Array<Record<string, any>>>('/community/marketplace');
    if (listings.length === 0) return getMarketplaceListings();

    return listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      price: Number(listing.price ?? 0),
      seller: listing.seller?.fullName || listing.seller?.username || 'Community seller',
      location: listing.village || listing.location || 'Ituku community',
      category: listing.category || 'General',
      description: listing.description || 'Fresh listing from the community.',
      badge: listing.featured ? 'Featured' : listing.condition || 'New',
      images: Array.isArray(listing.images) ? listing.images.map((image: Record<string, any>) => image.url) : [],
      isFeatured: Boolean(listing.featured),
      status: listing.status,
      createdAt: listing.createdAt,
      sellerId: listing.seller?.id,
      sellerUsername: listing.seller?.username,
      sellerPhoto: listing.seller?.profilePhoto,
      sellerVerified: Boolean(listing.seller?.isVerified),
      contactPreference: listing.contactPreference,
    }));
  } catch {
    return getMarketplaceListings();
  }
}

export async function createMarketplaceListing(payload: {
  title: string;
  description: string;
  category: string;
  condition?: string;
  price: number;
  village: string;
  contactPreference?: string;
  latitude?: number;
  longitude?: number;
  images?: Array<{ url: string; isPrimary?: boolean }>;
}) {
  try {
    const created = await request<Record<string, any>>('/community/marketplace', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      id: created.id,
      title: created.title,
      price: Number(created.price ?? payload.price),
      seller: created.seller?.fullName || created.seller?.username || 'You',
      location: created.village || payload.village || 'Ituku community',
      category: created.category || payload.category,
      description: created.description || payload.description,
      badge: created.featured ? 'Featured' : created.condition || payload.condition || 'New',
      images: Array.isArray(created.images) ? created.images.map((image: Record<string, any>) => image.url) : payload.images?.map((image) => image.url) || [],
      status: created.status,
      createdAt: created.createdAt,
    };
  } catch {
    const session = getSession();
    const fallback = {
      id: `mkt-${Date.now()}`,
      title: payload.title,
      price: Number(payload.price),
      seller: session?.user?.fullName || 'You',
      location: payload.village || 'Ituku community',
      category: payload.category,
      description: payload.description,
      badge: payload.condition || 'New',
      images: payload.images?.map((image) => image.url) || [],
    };

    const listings = [fallback, ...getMarketplaceListings()];
    saveMarketplaceListings(listings);
    return fallback;
  }
}

export function saveMarketplaceListings(listings: Array<Record<string, any>>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ituku-marketplace-listings', JSON.stringify(listings));
}

export function getCommunityPages() {
  if (typeof window === 'undefined') return [
    { id: 'seed-page-1', name: 'Ituku Business Hub', category: 'Business', followers: 812 },
    { id: 'seed-page-2', name: 'Catholic Youth Organization of Nigeria CYON', category: 'Church', followers: 460 },
    { id: 'seed-page-3', name: 'Community Secondary School Ituku CSSI Forum', category: 'School', followers: 221 },
  ];

  const raw = localStorage.getItem('ituku-community-pages');
  if (!raw) {
    const defaults = [
      { id: 'seed-page-1', name: 'Ituku Business Hub', category: 'Business', followers: 812 },
      { id: 'seed-page-2', name: 'Catholic Youth Organization of Nigeria CYON', category: 'Church', followers: 460 },
      { id: 'seed-page-3', name: 'Community Secondary School Ituku CSSI Forum', category: 'School', followers: 221 },
    ];
    localStorage.setItem('ituku-community-pages', JSON.stringify(defaults));
    return defaults;
  }

  try {
    const pages = JSON.parse(raw);
    if (Array.isArray(pages) && pages.length > 0) return pages;

    const defaults = [
      { id: 'seed-page-1', name: 'Ituku Business Hub', category: 'Business', followers: 812 },
      { id: 'seed-page-2', name: 'Catholic Youth Organization of Nigeria CYON', category: 'Church', followers: 460 },
      { id: 'seed-page-3', name: 'Community Secondary School Ituku CSSI Forum', category: 'School', followers: 221 },
    ];
    localStorage.setItem('ituku-community-pages', JSON.stringify(defaults));
    return defaults;
  } catch {
    localStorage.removeItem('ituku-community-pages');
    return getCommunityPages();
  }
}

export function saveCommunityPages(pages: Array<Record<string, any>>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ituku-community-pages', JSON.stringify(pages));
}

export function getSession(): { token?: string; user?: Record<string, any> } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ituku-auth');
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(payload: { token: string; user: Record<string, any> }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ituku-auth', JSON.stringify(payload));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ituku-auth');
}

export function getProfileSettings(): ProfileSettings {
  if (typeof window === 'undefined') return defaultProfileSettings;
  const raw = localStorage.getItem('ituku-profile-settings');
  return raw ? { ...defaultProfileSettings, ...JSON.parse(raw), privacy: { ...defaultProfileSettings.privacy, ...(JSON.parse(raw)?.privacy ?? {}) }, notifications: { ...defaultProfileSettings.notifications, ...(JSON.parse(raw)?.notifications ?? {}) }, appearance: { ...defaultProfileSettings.appearance, ...(JSON.parse(raw)?.appearance ?? {}) } } : defaultProfileSettings;
}

export function saveProfileSettings(settings: ProfileSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ituku-profile-settings', JSON.stringify(settings));
}

export function getProfilePhoto() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ituku-profile-photo');
}

export function saveProfilePhoto(value: string | null) {
  if (typeof window === 'undefined') return;
  if (!value) {
    localStorage.removeItem('ituku-profile-photo');
    return;
  }
  localStorage.setItem('ituku-profile-photo', value);
}

export function getCoverPhoto() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ituku-cover-photo');
}

export function saveCoverPhoto(value: string | null) {
  if (typeof window === 'undefined') return;
  if (!value) {
    localStorage.removeItem('ituku-cover-photo');
    return;
  }
  localStorage.setItem('ituku-cover-photo', value);
}

export function getSavedItems() {
  if (typeof window === 'undefined') return [
    { id: 'p1', type: 'posts', title: 'Community clean-up drive', meta: 'Saved 2h ago' },
    { id: 'v1', type: 'videos', title: 'Youth summit recap', meta: 'Saved yesterday' },
    { id: 'ph1', type: 'photos', title: 'Village market evening', meta: 'Saved last week' },
    { id: 'e1', type: 'events', title: 'Community innovation fair', meta: 'Saved 3 days ago' },
  ];
  const raw = localStorage.getItem('ituku-saved-items');
  return raw ? JSON.parse(raw) : [
    { id: 'p1', type: 'posts', title: 'Community clean-up drive', meta: 'Saved 2h ago' },
    { id: 'v1', type: 'videos', title: 'Youth summit recap', meta: 'Saved yesterday' },
    { id: 'ph1', type: 'photos', title: 'Village market evening', meta: 'Saved last week' },
    { id: 'e1', type: 'events', title: 'Community innovation fair', meta: 'Saved 3 days ago' },
  ];
}

export function saveSavedItems(items: Array<Record<string, string>>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ituku-saved-items', JSON.stringify(items));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export async function registerUser(payload: {
  email: string;
  username: string;
  password: string;
  fullName: string;
  village: string;
  phone?: string;
  verificationMethod?: 'email' | 'phone';
}) {
  return request<{ token: string; user: Record<string, any> }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: { identifier: string; password: string }) {
  return request<{ token: string; user: Record<string, any> }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestOtpForUser(userId: string) {
  return request<{ success: boolean }>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function sendVerificationEmail(email: string) {
  return request<{ success: boolean }>('/auth/send-verification-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailToken(token: string) {
  return request<{ user: Record<string, any> }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function verifyOtp(userId: string, code: string) {
  return request<{ token: string }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ userId, code }),
  });
}

export async function fetchProfile() {
  const session = getSession();
  if (session?.user) return session.user;

  try {
    return await request<Record<string, any>>('/auth/me');
  } catch {
    if (typeof window === 'undefined') {
      throw new Error('Profile unavailable');
    }
    const users = getLocalUsers();
    const current = getSession();
    const found = users.find((user) => user.email === current?.user?.email || user.username === current?.user?.username);
    if (!found) throw new Error('Profile unavailable');
    return { ...found, password: undefined };
  }
}

export async function updateProfile(payload: { fullName?: string; username?: string; email?: string; village?: string; bio?: string; phone?: string }) {
  try {
    return await request<Record<string, any>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch {
    if (typeof window === 'undefined') throw new Error('Profile update unavailable');

    const session = getSession();
    const users = getLocalUsers();
    const index = users.findIndex((user) => user.email === session?.user?.email || user.username === session?.user?.username);

    if (index === -1) {
      throw new Error('Profile update unavailable');
    }

    const updated = {
      ...users[index],
      ...payload,
    };

    users[index] = updated;
    persistLocalUsers(users);

    const response = {
      ...updated,
      password: undefined,
    };
    saveSession({ token: session?.token ?? 'local-demo-token', user: response });
    return response;
  }
}

export async function fundWallet(amount: number) {
  return request<{ id: string; balance: number }>('/auth/wallet/fund', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function fetchWalletBalance() {
  return request<{ balance: number }>('/wallet/balance');
}

export async function fetchWalletLedger(limit = 50, offset = 0) {
  return request<Array<{ id: string; amount: number; type: string; description: string; referenceId?: string; createdAt: string }>>(`/wallet/ledger?limit=${limit}&offset=${offset}`);
}

export async function fetchWalletTransfers(limit = 50, offset = 0) {
  return request<Array<{ id: string; amount: number; type: 'sent' | 'received'; status: string; createdAt: string; receiver?: { username: string }; sender?: { username: string } }>>(`/wallet/transactions?limit=${limit}&offset=${offset}`);
}

export async function fetchUserDirectory(query: string) {
  return request<Array<{ id: string; username: string; fullName: string }>>(`/users/directory?q=${encodeURIComponent(query)}`);
}

export async function fetchUserProfile(usernameOrId: string) {
  return request<Record<string, any>>(`/users/profile/${encodeURIComponent(usernameOrId)}`);
}

export type ProfileConnection = {
  id: string;
  username: string;
  fullName: string;
  profilePhoto?: string | null;
  bio?: string | null;
  isFollowedBack?: boolean;
};

export async function fetchUserFollowers(userId: string) {
  return request<ProfileConnection[]>(`/users/${encodeURIComponent(userId)}/followers`);
}

export async function fetchUserFollowing(userId: string) {
  return request<ProfileConnection[]>(`/users/${encodeURIComponent(userId)}/following`);
}

export async function followUser(userId: string) {
  return request<{ success: boolean; following: boolean }>(`/users/${encodeURIComponent(userId)}/follow`, { method: 'POST' });
}

export async function unfollowUser(userId: string) {
  return request<{ success: boolean; following: boolean }>(`/users/${encodeURIComponent(userId)}/follow`, { method: 'DELETE' });
}

export async function sendFriendRequest(userId: string) {
  return request<Record<string, any>>(`/users/friend-request/${encodeURIComponent(userId)}`, { method: 'POST' });
}

export async function unfriendUser(userId: string) {
  return request<{ success: boolean }>(`/users/${encodeURIComponent(userId)}/friend`, { method: 'DELETE' });
}

export async function sendPrivateMessage(receiverId: string, content: string) {
  return request<{ id: string; senderId: string; receiverId: string; content: string; createdAt: string }>('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content }),
  });
}

export async function sendWalletCoins(receiverId: string, amount: number) {
  return request<{ success: boolean; senderBalance: number }>('/wallet/send-coins', {
    method: 'POST',
    body: JSON.stringify({ receiverId, amount }),
  });
}

export async function requestWalletWithdrawal(amount: number, bankAccount: string, accountHolderName: string) {
  return request<{ success: boolean; remainingBalance: number; withdrawal: { id: string; status: string; amount: number } }>('/wallet/request-withdrawal', {
    method: 'POST',
    body: JSON.stringify({ amount, bankAccount, accountHolderName }),
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ success: boolean }>('/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return request<{ success: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function fetchNotifications() {
  return request<{ success: boolean; data: Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }> }>('/notifications');
}

export async function openDirectChat(userId: string) {
  return request<{ id: string; participants: Array<{ userId: string }> }>(`/chat/conversations/direct/${encodeURIComponent(userId)}`, { method: 'POST' });
}

export async function fetchChatDetail(conversationId: string) {
  return request<{ conversation: { id: string }; messages: Array<Record<string, any>> }>(`/chat/conversations/${encodeURIComponent(conversationId)}`);
}

export async function sendChatMessage(payload: { conversationId: string; content: string; replyToMessageId?: string }) {
  return request<Record<string, any>>('/chat/messages', { method: 'POST', body: JSON.stringify(payload) });
}

export async function editChatMessage(messageId: string, content: string) {
  return request<Record<string, any>>(`/chat/messages/${encodeURIComponent(messageId)}`, { method: 'PUT', body: JSON.stringify({ content }) });
}

export async function deleteChatMessage(messageId: string) {
  return request<Record<string, any>>(`/chat/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
}

export async function startChatCall(conversationId: string, type: 'VOICE' | 'VIDEO') {
  return request<{ id: string; conversationId: string; receiverId: string; type: 'VOICE' | 'VIDEO'; status: string }>('/chat/calls', {
    method: 'POST',
    body: JSON.stringify({ conversationId, type }),
  });
}

export async function updateChatCall(callId: string, action: 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'ENDED' | 'MISSED' | 'FAILED') {
  return request<{ id: string; status: string }>(`/chat/calls/${encodeURIComponent(callId)}/${action}`, { method: 'POST' });
}

export async function fetchFeed(limit = 20, offset = 0) {
  return request<Array<{ id: string; content: string; photo?: string | null; createdAt: string; author: { id: string; fullName: string; username: string; village: string }; _count?: { comments: number; likes: number; shares: number } }>>(`/community/feed?limit=${limit}&offset=${offset}`);
}

export async function createPost(content: string, photo?: string) {
  return request<{ id: string; content: string; photo?: string | null }>('/community/posts', {
    method: 'POST',
    body: JSON.stringify({ content, photo }),
  });
}

export async function likePost(postId: string) {
  return request<{ success: boolean; likesCount: number }>(`/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function unlikePost(postId: string) {
  return request<{ success: boolean; likesCount: number }>(`/posts/${encodeURIComponent(postId)}/like`, { method: 'DELETE' });
}

export async function addPostComment(postId: string, content: string) {
  return request<Record<string, any>>(`/posts/${encodeURIComponent(postId)}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
}

export async function fetchPostComments(postId: string, basePath = `/posts/${encodeURIComponent(postId)}/comments`) {
  return request<Array<Record<string, any>>>(basePath);
}

export async function addCommentReply(postId: string, parentId: string, content: string, mediaUrl?: string, basePath = `/posts/${encodeURIComponent(postId)}/comments`) {
  return request<Record<string, any>>(basePath, { method: 'POST', body: JSON.stringify({ content, parentId: parentId || undefined, mediaUrl }) });
}

export async function editPostComment(postId: string, commentId: string, content: string, basePath = `/posts/${encodeURIComponent(postId)}/comments`) {
  return request<Record<string, any>>(`${basePath}/${encodeURIComponent(commentId)}`, { method: 'PUT', body: JSON.stringify({ content }) });
}

export async function deletePostComment(postId: string, commentId: string, basePath = `/posts/${encodeURIComponent(postId)}/comments`) {
  return request<{ success: boolean }>(`${basePath}/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
}

export async function toggleCommentReaction(postId: string, commentId: string, basePath = `/posts/${encodeURIComponent(postId)}/comments`) {
  return request<{ reacted: boolean; count: number }>(`${basePath}/${encodeURIComponent(commentId)}/reaction`, { method: 'POST' });
}

export async function sharePost(postId: string) {
  return request<{ success: boolean; sharesCount: number }>(`/posts/${encodeURIComponent(postId)}/share`, { method: 'POST' });
}

export async function fetchVillages() {
  return request<Array<{ name: string; members: number }>>('/community/villages');
}

export async function fetchVillage(name: string) {
  return request<{ name: string; members: number; posts: Array<{ id: string; content: string; createdAt: string; author: { fullName: string; username: string; village: string } }> }>(`/community/villages/${encodeURIComponent(name)}`);
}

export async function fetchGroups() {
  return request<Array<{ id: string; name: string; slug: string; category: string; _count: { members: number } }>>('/community/groups');
}

export async function createGroup(payload: { name: string; category?: string }) {
  return request<{ id: string; name: string; slug: string }>('/community/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchPages() {
  return request<Array<{ id: string; name: string; slug: string; category: string; followers: number; owner: { id: string; fullName: string; username: string }; _count?: { followersOf: number; members: number; posts: number } }>>('/community/pages');
}

export async function createPage(payload: { name: string; category: string }) {
  return request<{ id: string; name: string; slug: string; category: string }>('/community/pages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchPage(pageId: string) {
  return request<{
    id: string;
    name: string;
    slug: string;
    category: string;
    description?: string | null;
    profilePhoto?: string | null;
    coverPhoto?: string | null;
    website?: string | null;
    phone?: string | null;
    address?: string | null;
    followers: number;
    isVerified: boolean;
    owner: { id: string; fullName: string; username: string };
    settings?: { allowMessages: boolean; allowComments: boolean; allowUserPosts: boolean } | null;
    _count?: { followersOf: number; members: number; posts: number };
    isFollowing: boolean;
    canManage: boolean;
  }>(`/community/pages/${encodeURIComponent(pageId)}`);
}

export async function followPage(pageId: string) {
  return request<{ success: boolean; following: boolean; followers: number }>(`/community/pages/${encodeURIComponent(pageId)}/follow`, { method: 'POST' });
}

export async function unfollowPage(pageId: string) {
  return request<{ success: boolean; following: boolean; followers: number }>(`/community/pages/${encodeURIComponent(pageId)}/follow`, { method: 'DELETE' });
}

export async function fetchPageMembers(pageId: string) {
  return request<Array<{ id: string; userId: string; role: string; user: { id: string; fullName: string; username: string; profilePhoto?: string | null } }>>(`/community/pages/${encodeURIComponent(pageId)}/members`);
}

export async function updatePageMember(pageId: string, userId: string, role: string) {
  return request<{ id: string; userId: string; role: string }>(`/community/pages/${encodeURIComponent(pageId)}/members/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function removePageMember(pageId: string, userId: string) {
  return request<{ success: boolean }>(`/community/pages/${encodeURIComponent(pageId)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

export type PageSettings = {
  allowMessages: boolean;
  allowComments: boolean;
  allowUserPosts: boolean;
  followerVisibility: string;
  defaultPostStatus: string;
};

export async function fetchPageSettings(pageId: string) {
  return request<PageSettings>(`/community/pages/${encodeURIComponent(pageId)}/settings`);
}

export async function updatePageSettings(pageId: string, settings: Partial<PageSettings>) {
  return request<PageSettings>(`/community/pages/${encodeURIComponent(pageId)}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export type PageProfileUpdate = { name?: string; category?: string; description?: string; website?: string; phone?: string; address?: string; profilePhoto?: string; coverPhoto?: string };

export async function updatePageProfile(pageId: string, profile: PageProfileUpdate) {
  return request<Record<string, any>>(`/community/pages/${encodeURIComponent(pageId)}/profile`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function fetchPageAnalytics(pageId: string) {
  return request<{ followers: number; posts: number; views: number; followerAdds: number; followerDrops: number; postReach: number; postEngagement: number }>(`/community/pages/${encodeURIComponent(pageId)}/analytics`);
}

export async function fetchPagePosts(pageId: string, limit = 20, offset = 0) {
  return request<{ success: boolean; data: Array<{ id: string; content: string; photo?: string | null; likes: number; comments: number; createdAt: string; author: { fullName: string; username: string; profilePhoto?: string | null } }>; pagination: { total: number; hasMore: boolean } }>(`/pages/${encodeURIComponent(pageId)}/posts?limit=${limit}&offset=${offset}`);
}

export async function createPagePost(pageId: string, content: string, photo?: string) {
  return request<{ success: boolean; data: { id: string; content: string; photo?: string | null; likes: number; comments: number; createdAt: string; author: { fullName: string; username: string; profilePhoto?: string | null } } }>(`/pages/${encodeURIComponent(pageId)}/posts`, {
    method: 'POST',
    body: JSON.stringify({ content, photo }),
  });
}

/**
 * Upload a file to the server
 * @param file File to upload
 * @param directory Directory to store file in (e.g., 'profiles', 'covers', 'marketplace')
 */
export async function uploadFile(file: File, directory: string = 'general') {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(buildApiUrl(`/upload?directory=${directory}`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getSession()?.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Upload a profile photo
 * @param file Image file to upload
 */
export async function uploadProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(buildApiUrl('/upload/profile-photo'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getSession()?.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Profile photo upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Profile photo upload error:', error);
    throw error;
  }
}

/**
 * Upload a cover photo
 * @param file Image file to upload
 */
export async function uploadCoverPhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(buildApiUrl('/upload/cover-photo'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getSession()?.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cover photo upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Cover photo upload error:', error);
    throw error;
  }
}

/**
 * Upload a marketplace image
 * @param file Image file to upload
 */
export async function uploadMarketplaceImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(buildApiUrl('/upload/marketplace'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getSession()?.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Marketplace image upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Marketplace image upload error:', error);
    throw error;
  }
}
