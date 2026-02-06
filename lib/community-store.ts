// In-memory store for community data (demo purposes)
// In production, replace with a proper database like Supabase or Neon

export interface User {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  location: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: "text" | "image" | "payment" | "bond" | "system";
  imageUrl?: string;
  paymentData?: {
    to: string;
    toName: string;
    amount: number;
    note: string;
  };
  bondData?: {
    borrower: string;
    borrowerName: string;
    lender: string;
    lenderName: string;
    amount: number;
    interestRate: number;
    durationDays: number;
    status: "pending" | "active" | "repaid" | "defaulted";
  };
  timestamp: number;
}

export interface Bond {
  id: string;
  borrowerId: string;
  borrowerName: string;
  lenderId: string | null;
  lenderName: string | null;
  amount: number;
  interestRate: number;
  durationDays: number;
  purpose: string;
  status: "open" | "funded" | "repaid" | "defaulted";
  createdAt: number;
  fundedAt: number | null;
  dueDate: number | null;
}

export interface ImagePost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: string[];
  comments: { userId: string; userName: string; text: string; timestamp: number }[];
  timestamp: number;
}

export interface SignalMessage {
  from: string;
  to: string;
  type: "offer" | "answer" | "candidate" | "hangup";
  data: string;
  timestamp: number;
}

// Demo users
const demoUsers: User[] = [
  { id: "user-1", name: "Ravi Kumar", avatar: "RK", balance: 25000, location: "Punjab" },
  { id: "user-2", name: "Priya Sharma", avatar: "PS", balance: 18000, location: "Haryana" },
  { id: "user-3", name: "Amit Patel", avatar: "AP", balance: 32000, location: "Gujarat" },
  { id: "user-4", name: "Sunita Devi", avatar: "SD", balance: 15000, location: "Bihar" },
  { id: "user-5", name: "Rajesh Yadav", avatar: "RY", balance: 21000, location: "Uttar Pradesh" },
];

// Seed messages
const seedMessages: ChatMessage[] = [
  {
    id: "msg-1",
    userId: "user-2",
    userName: "Priya Sharma",
    userAvatar: "PS",
    content: "Has anyone tried the new drought-resistant wheat variety? Yields look promising in Haryana.",
    type: "text",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "msg-2",
    userId: "user-3",
    userName: "Amit Patel",
    userAvatar: "AP",
    content: "Yes! I planted 2 acres last season. Got about 15% better yield even with less water. Highly recommend.",
    type: "text",
    timestamp: Date.now() - 3200000,
  },
  {
    id: "msg-3",
    userId: "user-4",
    userName: "Sunita Devi",
    userAvatar: "SD",
    content: "Looking for suggestions on organic pest control for rice paddies. Any natural remedies?",
    type: "text",
    timestamp: Date.now() - 2800000,
  },
  {
    id: "msg-4",
    userId: "user-5",
    userName: "Rajesh Yadav",
    userAvatar: "RY",
    content: "Neem oil spray works great! Mix 5ml per liter of water and spray early morning. Been using it for 3 years.",
    type: "text",
    timestamp: Date.now() - 2400000,
  },
  {
    id: "msg-5",
    userId: "user-1",
    userName: "Ravi Kumar",
    userAvatar: "RK",
    content: "PM-KISAN 15th installment just got credited! Check your bank accounts, everyone.",
    type: "text",
    timestamp: Date.now() - 1800000,
  },
];

const seedBonds: Bond[] = [
  {
    id: "bond-1",
    borrowerId: "user-4",
    borrowerName: "Sunita Devi",
    lenderId: null,
    lenderName: null,
    amount: 5000,
    interestRate: 3,
    durationDays: 90,
    purpose: "Need funds for organic fertilizer purchase before sowing season",
    status: "open",
    createdAt: Date.now() - 86400000,
    fundedAt: null,
    dueDate: null,
  },
  {
    id: "bond-2",
    borrowerId: "user-5",
    borrowerName: "Rajesh Yadav",
    lenderId: "user-3",
    lenderName: "Amit Patel",
    amount: 8000,
    interestRate: 4,
    durationDays: 120,
    purpose: "Equipment repair for harvesting season",
    status: "funded",
    createdAt: Date.now() - 172800000,
    fundedAt: Date.now() - 86400000,
    dueDate: Date.now() + 86400000 * 119,
  },
];

const seedImages: ImagePost[] = [
  {
    id: "img-1",
    userId: "user-3",
    userName: "Amit Patel",
    userAvatar: "AP",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    caption: "Golden wheat fields ready for harvest in Gujarat. This season has been blessed!",
    likes: ["user-1", "user-2", "user-4"],
    comments: [
      { userId: "user-1", userName: "Ravi Kumar", text: "Beautiful crop! What variety is this?", timestamp: Date.now() - 1200000 },
    ],
    timestamp: Date.now() - 7200000,
  },
  {
    id: "img-2",
    userId: "user-2",
    userName: "Priya Sharma",
    userAvatar: "PS",
    imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop",
    caption: "New drip irrigation system installed. Should save 40% water this season.",
    likes: ["user-3", "user-5"],
    comments: [
      { userId: "user-5", userName: "Rajesh Yadav", text: "Which brand? I want to set up the same.", timestamp: Date.now() - 600000 },
    ],
    timestamp: Date.now() - 14400000,
  },
];

// Global stores
const store = {
  users: [...demoUsers],
  messages: [...seedMessages],
  bonds: [...seedBonds],
  images: [...seedImages],
  signals: [] as SignalMessage[],
  messageCounter: 6,
  bondCounter: 3,
  imageCounter: 3,
};

export function getUsers() {
  return store.users;
}

export function getUser(id: string) {
  return store.users.find((u) => u.id === id) || null;
}

export function getMessages(since?: number) {
  if (since) {
    return store.messages.filter((m) => m.timestamp > since);
  }
  return store.messages;
}

export function addMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
  const newMsg: ChatMessage = {
    ...msg,
    id: `msg-${store.messageCounter++}`,
    timestamp: Date.now(),
  };
  store.messages.push(newMsg);
  return newMsg;
}

export function getBonds() {
  return store.bonds;
}

export function addBond(bond: Omit<Bond, "id" | "createdAt" | "fundedAt" | "dueDate" | "lenderId" | "lenderName" | "status">) {
  const newBond: Bond = {
    ...bond,
    id: `bond-${store.bondCounter++}`,
    lenderId: null,
    lenderName: null,
    status: "open",
    createdAt: Date.now(),
    fundedAt: null,
    dueDate: null,
  };
  store.bonds.push(newBond);
  return newBond;
}

export function fundBond(bondId: string, lenderId: string, lenderName: string) {
  const bond = store.bonds.find((b) => b.id === bondId);
  if (!bond || bond.status !== "open") return null;

  const lender = store.users.find((u) => u.id === lenderId);
  if (!lender || lender.balance < bond.amount) return null;

  lender.balance -= bond.amount;
  const borrower = store.users.find((u) => u.id === bond.borrowerId);
  if (borrower) borrower.balance += bond.amount;

  bond.lenderId = lenderId;
  bond.lenderName = lenderName;
  bond.status = "funded";
  bond.fundedAt = Date.now();
  bond.dueDate = Date.now() + bond.durationDays * 86400000;

  return bond;
}

export function repayBond(bondId: string) {
  const bond = store.bonds.find((b) => b.id === bondId);
  if (!bond || bond.status !== "funded") return null;

  const borrower = store.users.find((u) => u.id === bond.borrowerId);
  const lender = store.users.find((u) => u.id === bond.lenderId);
  const repayAmount = Math.round(bond.amount * (1 + bond.interestRate / 100));

  if (!borrower || borrower.balance < repayAmount) return null;

  borrower.balance -= repayAmount;
  if (lender) lender.balance += repayAmount;

  bond.status = "repaid";
  return bond;
}

export function makePayment(fromId: string, toId: string, amount: number, note: string) {
  const sender = store.users.find((u) => u.id === fromId);
  const receiver = store.users.find((u) => u.id === toId);

  if (!sender || !receiver || sender.balance < amount || amount <= 0) return null;

  sender.balance -= amount;
  receiver.balance += amount;

  return { sender, receiver, amount, note };
}

export function getImages() {
  return store.images;
}

export function addImage(post: Omit<ImagePost, "id" | "likes" | "comments" | "timestamp">) {
  const newPost: ImagePost = {
    ...post,
    id: `img-${store.imageCounter++}`,
    likes: [],
    comments: [],
    timestamp: Date.now(),
  };
  store.images.unshift(newPost);
  return newPost;
}

export function toggleLike(imageId: string, userId: string) {
  const img = store.images.find((i) => i.id === imageId);
  if (!img) return null;
  const idx = img.likes.indexOf(userId);
  if (idx > -1) {
    img.likes.splice(idx, 1);
  } else {
    img.likes.push(userId);
  }
  return img;
}

export function addComment(imageId: string, comment: { userId: string; userName: string; text: string }) {
  const img = store.images.find((i) => i.id === imageId);
  if (!img) return null;
  img.comments.push({ ...comment, timestamp: Date.now() });
  return img;
}

export function addSignal(signal: SignalMessage) {
  store.signals.push(signal);
  // Keep only last 100 signals
  if (store.signals.length > 100) {
    store.signals = store.signals.slice(-100);
  }
}

export function getSignals(userId: string, since: number) {
  return store.signals.filter((s) => s.to === userId && s.timestamp > since);
}
