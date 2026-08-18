export type CommunityRole =
  | "Village Chairman"
  | "Village Executive"
  | "Youth Chairman"
  | "Youth Executive"
  | "Ordinary Member";

export type CommunityMember = {
  id: string;
  name: string;
  role: CommunityRole;
  isAdmin: boolean;
  status: "Active" | "Suspended 2 weeks" | "Suspended 3 months" | "Suspended 1 year";
  coinBalance: number;
  fineDue: number;
};

export type CommunityMeeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  host: string;
  agenda: string;
};

export type CommunityPoll = {
  id: string;
  question: string;
  ends: string;
  options: Array<{ id: string; label: string; votes: number }>;
};

export type CommunityFeedPost = {
  id: string;
  author: string;
  role: CommunityRole;
  text: string;
  time: string;
};

export type CommunityRecord = {
  slug: string;
  name: string;
  summary: string;
  members: number;
  online: number;
  region: string;
  motto: string;
  coinBalance: number;
  guidelines: string[];
  reservedPositions: Array<{ title: string; admin: boolean; description: string }>;
  membersList: CommunityMember[];
  meetings: CommunityMeeting[];
  polls: CommunityPoll[];
  feed: CommunityFeedPost[];
};

export const communityDirectory: CommunityRecord[] = [
  {
    slug: "amokolo",
    name: "Amokolo",
    summary: "Village unity, development and social coordination across households and youth programmes.",
    members: 1842,
    online: 214,
    region: "Central District",
    motto: "One village, one progress plan.",
    coinBalance: 1270,
    guidelines: [
      "Respect elders, youth and every household in the village.",
      "Share important community notices with accurate facts and updates.",
      "Keep discussions useful and constructive for development and safety.",
      "No hate speech, intimidation, or misinformation in community rooms.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Oversees community direction and makes governance decisions." },
      { title: "Village Executive", admin: true, description: "Supports projects, compliance and welfare coordination." },
      { title: "Youth Chairman", admin: true, description: "Leads youth activity, mobilization and peace initiatives." },
      { title: "Youth Executive", admin: true, description: "Coordinates youth programmes and community events." },
      { title: "Ordinary Member", admin: false, description: "Participates in discussions, meetings and community updates." },
    ],
    membersList: [
      { id: "a1", name: "Eze Nwosu", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 420, fineDue: 0 },
      { id: "a2", name: "Martha Okafor", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 310, fineDue: 0 },
      { id: "a3", name: "Chinonso Ude", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 290, fineDue: 0 },
      { id: "a4", name: "Ifeoma Eze", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 260, fineDue: 0 },
      { id: "a5", name: "Kelechi Nnaji", role: "Ordinary Member", isAdmin: false, status: "Suspended 2 weeks", coinBalance: 110, fineDue: 25 },
      { id: "a6", name: "Adaobi Opara", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 185, fineDue: 0 },
    ],
    meetings: [
      { id: "m1", title: "Village welfare meeting", date: "Tuesday, 18 Aug", time: "6:30 PM", host: "Village Chairman", agenda: "Project funding and youth outreach updates." },
      { id: "m2", title: "Youth innovation forum", date: "Thursday, 21 Aug", time: "6:00 PM", host: "Youth Chairman", agenda: "Skills training and digital learning agenda." },
    ],
    polls: [
      { id: "p1", question: "Which social project should the village prioritize this quarter?", ends: "Ends in 2 days", options: [
        { id: "o1", label: "Market stalls upgrade", votes: 48 },
        { id: "o2", label: "Youth skills hub", votes: 32 },
        { id: "o3", label: "Clean water support", votes: 27 },
      ] },
    ],
    feed: [
      { id: "f1", author: "Martha Okafor", role: "Village Executive", text: "The community farm support drive is now open. Please confirm your contribution before Friday.", time: "12 min ago" },
      { id: "f2", author: "Chinonso Ude", role: "Youth Chairman", text: "Youth volunteers are meeting to map out the digital literacy week. Kindly join the next planning room.", time: "47 min ago" },
    ],
  },
  {
    slug: "umukulu",
    name: "Umukulu",
    summary: "Family, learning and enterprise alignment across the wider Umukulu network.",
    members: 2060,
    online: 188,
    region: "South District",
    motto: "Knowledge, care and shared growth.",
    coinBalance: 1495,
    guidelines: [
      "Be clear, respectful and constructive in all community conversations.",
      "Community actions should support youth development and family wellbeing.",
      "Promote truthful information and verified opportunities.",
      "Admins can enforce standards when safety, fairness or trust are affected.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Sets the agenda and approves community actions." },
      { title: "Village Executive", admin: true, description: "Coordinates committees and support programmes." },
      { title: "Youth Chairman", admin: true, description: "Leads youth empowerment efforts and social engagement." },
      { title: "Youth Executive", admin: true, description: "Coordinates activities and training sessions." },
      { title: "Ordinary Member", admin: false, description: "Contributes updates, participates in polls and town meetings." },
    ],
    membersList: [
      { id: "u1", name: "Okafor Ifeanyi", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 450, fineDue: 0 },
      { id: "u2", name: "Amina Ede", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 320, fineDue: 0 },
      { id: "u3", name: "Tochukwu Agwu", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 270, fineDue: 0 },
      { id: "u4", name: "Uche Okorie", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 250, fineDue: 0 },
      { id: "u5", name: "Rose Nwoko", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 145, fineDue: 0 },
      { id: "u6", name: "Musa Nwachukwu", role: "Ordinary Member", isAdmin: false, status: "Suspended 3 months", coinBalance: 50, fineDue: 45 },
    ],
    meetings: [
      { id: "u-m1", title: "Community advisory session", date: "Wednesday, 20 Aug", time: "7:00 PM", host: "Village Chairman", agenda: "Shared development planning and funding conversations." },
    ],
    polls: [
      { id: "u-p1", question: "What should be the next youth engagement focus?", ends: "Ends in 3 days", options: [
        { id: "u-o1", label: "Digital skills bootcamp", votes: 54 },
        { id: "u-o2", label: "Sports and mentorship", votes: 39 },
        { id: "u-o3", label: "Enterprise coaching", votes: 26 },
      ] },
    ],
    feed: [
      { id: "u-f1", author: "Amina Ede", role: "Village Executive", text: "We are launching a learning support drive. Please send your recommendations in the group room.", time: "9 min ago" },
      { id: "u-f2", author: "Tochukwu Agwu", role: "Youth Chairman", text: "The youth town hall will cover business ideas, coaching and volunteering opportunities.", time: "1 hour ago" },
    ],
  },
  {
    slug: "ugwunagbo",
    name: "Ugwunagbo",
    summary: "Community leadership, stewardship and inclusive membership support.",
    members: 1725,
    online: 156,
    region: "West District",
    motto: "Civic care that keeps everyone connected.",
    coinBalance: 1380,
    guidelines: [
      "Keep every action focused on progress and mutual respect.",
      "Report any violation directly to the appropriate admin channel.",
      "Community meetings must stay transparent and accountable.",
      "Coin fines are handled through the official ItukuApp settlement flow.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Steers village-wide coordination and major approvals." },
      { title: "Village Executive", admin: true, description: "Supports planning, projects and closures across committees." },
      { title: "Youth Chairman", admin: true, description: "Leads youth actions and peace-building outreach." },
      { title: "Youth Executive", admin: true, description: "Handles mobilisation, events and youth schedules." },
      { title: "Ordinary Member", admin: false, description: "Participates in member discussions and community events." },
    ],
    membersList: [
      { id: "g1", name: "Nneka Egbu", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 420, fineDue: 0 },
      { id: "g2", name: "Benedict Ogbu", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 335, fineDue: 0 },
      { id: "g3", name: "Ada Okoye", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 300, fineDue: 0 },
      { id: "g4", name: "Nnamdi Anya", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 275, fineDue: 0 },
      { id: "g5", name: "Favour Ofor", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 140, fineDue: 0 },
      { id: "g6", name: "David Emeka", role: "Ordinary Member", isAdmin: false, status: "Suspended 1 year", coinBalance: 40, fineDue: 60 },
    ],
    meetings: [
      { id: "g-m1", title: "Security and welfare review", date: "Monday, 25 Aug", time: "5:45 PM", host: "Village Chairman", agenda: "Assess community safety concerns and neighbourhood response plans." },
    ],
    polls: [
      { id: "g-p1", question: "Which initiative should lead the next community action day?", ends: "Ends in 1 day", options: [
        { id: "g-o1", label: "Community clean-up", votes: 71 },
        { id: "g-o2", label: "School support drive", votes: 49 },
        { id: "g-o3", label: "Healthcare outreach", votes: 21 },
      ] },
    ],
    feed: [
      { id: "g-f1", author: "Ada Okoye", role: "Youth Chairman", text: "We are inviting volunteers for the neighbourhood outreach and social support programme.", time: "21 min ago" },
      { id: "g-f2", author: "Nneka Egbu", role: "Village Chairman", text: "The executive team will review project submissions this evening. Please share your proposals before 8 PM.", time: "2 hours ago" },
    ],
  },
  {
    slug: "okwenachala",
    name: "Okwenachala",
    summary: "Connected community planning for civic action, youth growth and local welfare.",
    members: 1984,
    online: 203,
    region: "East District",
    motto: "Unity in service and progress.",
    coinBalance: 1560,
    guidelines: [
      "Keep comments respectful, factual and supportive of collective growth.",
      "Use meeting rooms to propose solutions, not conflict.",
      "Community moderators may suspend or fine members for repeated policy violations.",
      "All fines must be settled through ItukuApp coin before restrictions are lifted.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Leads executive decisions and village-wide communication." },
      { title: "Village Executive", admin: true, description: "Supports social projects and governance actions." },
      { title: "Youth Chairman", admin: true, description: "Drives youth planning, support and mobilisation." },
      { title: "Youth Executive", admin: true, description: "Coordinates youth meetings and outreach sessions." },
      { title: "Ordinary Member", admin: false, description: "Contributes posts, attends meetings and polls." },
    ],
    membersList: [
      { id: "o1", name: "Chima Okafor", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 430, fineDue: 0 },
      { id: "o2", name: "Sarah Odu", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 355, fineDue: 0 },
      { id: "o3", name: "Obi Nwankwo", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 295, fineDue: 0 },
      { id: "o4", name: "Hannah Uzo", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 240, fineDue: 0 },
      { id: "o5", name: "Ijeoma Mba", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 165, fineDue: 0 },
      { id: "o6", name: "Stanley Udo", role: "Ordinary Member", isAdmin: false, status: "Suspended 2 weeks", coinBalance: 70, fineDue: 20 },
    ],
    meetings: [
      { id: "o-m1", title: "Youth development planning", date: "Friday, 22 Aug", time: "5:30 PM", host: "Youth Chairman", agenda: "Mentorship, skills training and support programmes." },
    ],
    polls: [
      { id: "o-p1", question: "Which community activity should be prioritised next?", ends: "Ends in 4 days", options: [
        { id: "o-o1", label: "Family support drive", votes: 68 },
        { id: "o-o2", label: "Youth business clinic", votes: 54 },
        { id: "o-o3", label: "Village safety walk", votes: 29 },
      ] },
    ],
    feed: [
      { id: "o-f1", author: "Sarah Odu", role: "Village Executive", text: "The town hall notes are now available. Please review the recommendations before tomorrow’s meeting.", time: "34 min ago" },
      { id: "o-f2", author: "Obi Nwankwo", role: "Youth Chairman", text: "The youth network is preparing a mentorship week for students and young professionals.", time: "1 hour ago" },
    ],
  },
  {
    slug: "ofeinyi",
    name: "Ofeinyi",
    summary: "Community leadership, collaboration and social care for homes, businesses and youth.",
    members: 2148,
    online: 229,
    region: "Northwest District",
    motto: "Strong homes, better futures.",
    coinBalance: 1610,
    guidelines: [
      "Respect member privacy and avoid personal attacks.",
      "Use clear, factual updates in the feed and community chats.",
      "Admins have authority to moderate and enforce community standards.",
      "Any suspension remains active until the required coin fine is cleared.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Manages meetings, community direction and enforcement decisions." },
      { title: "Village Executive", admin: true, description: "Coordinates operations, welfare and project updates." },
      { title: "Youth Chairman", admin: true, description: "Coordinates youth activities and mobilisation programmes." },
      { title: "Youth Executive", admin: true, description: "Supports youth forum planning and event schedules." },
      { title: "Ordinary Member", admin: false, description: "Takes part in the village network, feed and polls." },
    ],
    membersList: [
      { id: "f1", name: "Dr. Madueke", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 500, fineDue: 0 },
      { id: "f2", name: "Ngozi Owele", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 330, fineDue: 0 },
      { id: "f3", name: "Kelechi Mba", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 300, fineDue: 0 },
      { id: "f4", name: "Babatunde Ojo", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 250, fineDue: 0 },
      { id: "f5", name: "Aisha Sambo", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 135, fineDue: 0 },
      { id: "f6", name: "Emmanuel Ochon", role: "Ordinary Member", isAdmin: false, status: "Suspended 3 months", coinBalance: 60, fineDue: 50 },
    ],
    meetings: [
      { id: "f-m1", title: "Household welfare conversation", date: "Tuesday, 26 Aug", time: "7:15 PM", host: "Village Chairman", agenda: "Review support channels, business opportunities and welfare needs." },
    ],
    polls: [
      { id: "f-p1", question: "Which community venture should be supported this month?", ends: "Ends in 2 days", options: [
        { id: "f-o1", label: "Youth business capital", votes: 61 },
        { id: "f-o2", label: "School supplies fund", votes: 43 },
        { id: "f-o3", label: "Public health drive", votes: 35 },
      ] },
    ],
    feed: [
      { id: "f-f1", author: "Ngozi Owele", role: "Village Executive", text: "New welfare entries are available for families needing seasonal support and care resources.", time: "17 min ago" },
      { id: "f-f2", author: "Kelechi Mba", role: "Youth Chairman", text: "We are planning a mentoring week and welcome volunteers with practical skills.", time: "49 min ago" },
    ],
  },
  {
    slug: "amata",
    name: "Amata",
    summary: "Shared living, youth mobilisation and village support across households and families.",
    members: 1765,
    online: 171,
    region: "Central East",
    motto: "One community, many hands.",
    coinBalance: 1425,
    guidelines: [
      "No abuse, intimidation or repeated spam in village rooms.",
      "Admins can act quickly to protect trust and maintain community standards.",
      "Public discussions should remain relevant to village life and wellbeing.",
      "Penalty decisions are recorded and applied through the coin settlement system.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Directs village leadership and community commitments." },
      { title: "Village Executive", admin: true, description: "Coordinates life and welfare projects across the village." },
      { title: "Youth Chairman", admin: true, description: "Leads youth programmes and engagement activities." },
      { title: "Youth Executive", admin: true, description: "Implements youth plans and community outreach." },
      { title: "Ordinary Member", admin: false, description: "Contributes to meetings, discussions and local welfare actions." },
    ],
    membersList: [
      { id: "am1", name: "Ebere Ugwu", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 440, fineDue: 0 },
      { id: "am2", name: "Nkechi Amadi", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 315, fineDue: 0 },
      { id: "am3", name: "Tobi Anya", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 280, fineDue: 0 },
      { id: "am4", name: "Lilian Okoro", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 245, fineDue: 0 },
      { id: "am5", name: "Nduka Anozie", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 178, fineDue: 0 },
      { id: "am6", name: "Ada Okafor", role: "Ordinary Member", isAdmin: false, status: "Suspended 2 weeks", coinBalance: 80, fineDue: 30 },
    ],
    meetings: [
      { id: "am-m1", title: "Household and youth support forum", date: "Thursday, 28 Aug", time: "6:15 PM", host: "Village Executive", agenda: "Support pathways, volunteer signups and youth activity planning." },
    ],
    polls: [
      { id: "am-p1", question: "Which programme should receive the next village grant?", ends: "Ends in 5 days", options: [
        { id: "am-o1", label: "Farm support", votes: 51 },
        { id: "am-o2", label: "Youth training", votes: 42 },
        { id: "am-o3", label: "Health outreach", votes: 24 },
      ] },
    ],
    feed: [
      { id: "am-f1", author: "Nkechi Amadi", role: "Village Executive", text: "The village training plan is open for comments before committee approval today.", time: "14 min ago" },
      { id: "am-f2", author: "Tobi Anya", role: "Youth Chairman", text: "Volunteers are needed for the youth mentorship and leadership programme this weekend.", time: "57 min ago" },
    ],
  },
  {
    slug: "umunevonta",
    name: "Umunevonta",
    summary: "Civic engagement, youth motivation and village support with careful moderation.",
    members: 1922,
    online: 174,
    region: "Southwest District",
    motto: "Progress rooted in belonging.",
    coinBalance: 1510,
    guidelines: [
      "Aim for open, respectful and useful community discussions.",
      "Admins can adjust role access to protect community order and trust.",
      "All major actions should be visible and documented in the community room.",
      "Coin fines must be paid before a suspension is removed.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Leads governance, asks for reviews and approves setting changes." },
      { title: "Village Executive", admin: true, description: "Coordinates projects and welfare actions across the village." },
      { title: "Youth Chairman", admin: true, description: "Heads youth communication, learning and outreach programmes." },
      { title: "Youth Executive", admin: true, description: "Supports youth mentoring and event planning." },
      { title: "Ordinary Member", admin: false, description: "Participates, contributes and attends village meetings." },
    ],
    membersList: [
      { id: "um1", name: "Moses Ali", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 460, fineDue: 0 },
      { id: "um2", name: "Grace Igho", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 340, fineDue: 0 },
      { id: "um3", name: "Sonia Obi", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 310, fineDue: 0 },
      { id: "um4", name: "Thelma Umeh", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 270, fineDue: 0 },
      { id: "um5", name: "Peter Oshim", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 150, fineDue: 0 },
      { id: "um6", name: "Jude Odu", role: "Ordinary Member", isAdmin: false, status: "Suspended 1 year", coinBalance: 55, fineDue: 65 },
    ],
    meetings: [
      { id: "um-m1", title: "Progress and accountability forum", date: "Saturday, 30 Aug", time: "8:00 AM", host: "Village Chairman", agenda: "Review project progress and approval of youth outreach plan." },
    ],
    polls: [
      { id: "um-p1", question: "What should the village prioritise for community wellbeing?", ends: "Ends in 3 days", options: [
        { id: "um-o1", label: "School support", votes: 58 },
        { id: "um-o2", label: "Health and sanitation", votes: 50 },
        { id: "um-o3", label: "Digital inclusion", votes: 31 },
      ] },
    ],
    feed: [
      { id: "um-f1", author: "Grace Igho", role: "Village Executive", text: "The committee has released a draft update for review. Your input will shape the next actions.", time: "26 min ago" },
      { id: "um-f2", author: "Sonia Obi", role: "Youth Chairman", text: "The youth caucus is preparing an open engagement session for young members and new volunteers.", time: "1 hour ago" },
    ],
  },
  {
    slug: "umuowoh",
    name: "Umuowoh",
    summary: "Responsive village management, contribution, welfare and progress tracking.",
    members: 1665,
    online: 152,
    region: "Western District",
    motto: "Strong voices, shared action.",
    coinBalance: 1335,
    guidelines: [
      "Keep member interactions relevant and respectful.",
      "Admins have authority to issue warnings, suspensions and coin-based fines.",
      "Every action should be documented for fairness and transparency.",
      "Use the official coin system to resolve policy penalties.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Sets priorities and oversees community decisions." },
      { title: "Village Executive", admin: true, description: "Coordinates projects and welfare review sessions." },
      { title: "Youth Chairman", admin: true, description: "Leads youth mentorship and outreach planning." },
      { title: "Youth Executive", admin: true, description: "Tracks youth engagement and project activities." },
      { title: "Ordinary Member", admin: false, description: "Participates in the community and local initiatives." },
    ],
    membersList: [
      { id: "w1", name: "Nduka Nwaeze", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 410, fineDue: 0 },
      { id: "w2", name: "Kanyin Okafor", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 300, fineDue: 0 },
      { id: "w3", name: "Nkiru Ude", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 280, fineDue: 0 },
      { id: "w4", name: "Ayo Nnaji", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 250, fineDue: 0 },
      { id: "w5", name: "Emma Okezie", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 120, fineDue: 0 },
      { id: "w6", name: "Rosemary Obasi", role: "Ordinary Member", isAdmin: false, status: "Suspended 2 weeks", coinBalance: 55, fineDue: 25 },
    ],
    meetings: [
      { id: "w-m1", title: "Village prosperity briefing", date: "Sunday, 1 Sep", time: "4:00 PM", host: "Village Chairman", agenda: "Review support plans and launch next workstreams." },
    ],
    polls: [
      { id: "w-p1", question: "Which issue needs the most immediate attention?", ends: "Ends in 2 days", options: [
        { id: "w-o1", label: "Infrastructure support", votes: 57 },
        { id: "w-o2", label: "Youth funding", votes: 49 },
        { id: "w-o3", label: "Community clean-up", votes: 26 },
      ] },
    ],
    feed: [
      { id: "w-f1", author: "Kanyin Okafor", role: "Village Executive", text: "A partnership outline is ready for review. Please send your feedback directly before the next meeting.", time: "35 min ago" },
      { id: "w-f2", author: "Nkiru Ude", role: "Youth Chairman", text: "Youth-led outreach and mentorship sessions are being scheduled for the next month.", time: "1 hour ago" },
    ],
  },
  {
    slug: "umuonyiba",
    name: "Umuonyiba",
    summary: "Shared leadership, community learning and village-wide civic participation.",
    members: 1850,
    online: 169,
    region: "North District",
    motto: "Care, courage and steady progress.",
    coinBalance: 1480,
    guidelines: [
      "Keep all communication relevant to public good and constructive support.",
      "Members should respect the admin process for safeguarding the community.",
      "Moderators may impose temporary suspension, fine, or role review when required.",
      "Coin payments must be completed before flags or suspensions are cleared.",
    ],
    reservedPositions: [
      { title: "Village Chairman", admin: true, description: "Owns final decisions and community governance oversight." },
      { title: "Village Executive", admin: true, description: "Supports governance operations and welfare execution." },
      { title: "Youth Chairman", admin: true, description: "Leads youth participation and accountability initiatives." },
      { title: "Youth Executive", admin: true, description: "Supports young leaders with governance and communication support." },
      { title: "Ordinary Member", admin: false, description: "Contributes to the village feed, polls and community meetings." },
    ],
    membersList: [
      { id: "y1", name: "Emeka Ewelu", role: "Village Chairman", isAdmin: true, status: "Active", coinBalance: 470, fineDue: 0 },
      { id: "y2", name: "Chioma Ifediora", role: "Village Executive", isAdmin: true, status: "Active", coinBalance: 335, fineDue: 0 },
      { id: "y3", name: "Ikechukwu Dike", role: "Youth Chairman", isAdmin: true, status: "Active", coinBalance: 310, fineDue: 0 },
      { id: "y4", name: "Mary Jojo", role: "Youth Executive", isAdmin: true, status: "Active", coinBalance: 260, fineDue: 0 },
      { id: "y5", name: "Benedicta Ofor", role: "Ordinary Member", isAdmin: false, status: "Active", coinBalance: 145, fineDue: 0 },
      { id: "y6", name: "Daniel Okoro", role: "Ordinary Member", isAdmin: false, status: "Suspended 3 months", coinBalance: 40, fineDue: 35 },
    ],
    meetings: [
      { id: "y-m1", title: "Leadership and youth roundtable", date: "Monday, 2 Sep", time: "6:30 PM", host: "Youth Chairman", agenda: "Community engagement, mentorship and leadership development." },
    ],
    polls: [
      { id: "y-p1", question: "Which initiative deserves the next village spotlight?", ends: "Ends in 4 days", options: [
        { id: "y-o1", label: "Mentorship programme", votes: 63 },
        { id: "y-o2", label: "Youth entrepreneurship", votes: 52 },
        { id: "y-o3", label: "Health and welfare drive", votes: 28 },
      ] },
    ],
    feed: [
      { id: "y-f1", author: "Chioma Ifediora", role: "Village Executive", text: "The next community review will include updates on project support, youth mobilization and welfare planning.", time: "22 min ago" },
      { id: "y-f2", author: "Ikechukwu Dike", role: "Youth Chairman", text: "We are inviting youth members to submit ideas for the upcoming leadership and learning programme.", time: "1 hour ago" },
    ],
  },
];
