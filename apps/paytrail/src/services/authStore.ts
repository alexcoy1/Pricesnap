export interface User {
  id: string;
  email: string;
  displayName: string;
  businessName: string;
}

interface StoredUser extends User {
  password: string;
}

const USERS_KEY = 'paytrail_users';
const SESSION_KEY = 'paytrail_user';

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function login(email: string, password: string): boolean {
  const match = readUsers().find((u) => u.email === email && u.password === password);
  if (!match) return false;
  setSession({
    id: match.id,
    email: match.email,
    displayName: match.displayName,
    businessName: match.businessName,
  });
  return true;
}

export function signup(
  email: string,
  password: string,
  displayName: string,
  businessName?: string
): boolean {
  const users = readUsers();
  if (users.some((u) => u.email === email)) return false;

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email,
    password,
    displayName,
    businessName: businessName?.trim() || displayName,
  };
  users.push(newUser);
  writeUsers(users);
  setSession({
    id: newUser.id,
    email: newUser.email,
    displayName: newUser.displayName,
    businessName: newUser.businessName,
  });
  return true;
}

export function updateSession(patch: Partial<User>): User | null {
  const session = getSession();
  if (!session) return null;
  const updated = { ...session, ...patch };
  setSession(updated);

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === session.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...patch };
    writeUsers(users);
  }
  return updated;
}

export function requireUserId(): string {
  const session = getSession();
  if (!session) throw new Error('Not signed in');
  return session.id;
}
