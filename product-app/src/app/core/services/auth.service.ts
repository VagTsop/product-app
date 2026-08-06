import { computed, Injectable, signal } from '@angular/core';

export interface Session {
  readonly username: string;
  readonly displayName: string;
  readonly issuedAt: number;
}

const STORAGE_KEY = 'millenia.session';

/** Demo credentials — mirrors the original app's admin/user + 123. */
const CREDENTIALS: Record<string, { password: string; displayName: string }> = {
  admin: { password: '123', displayName: 'Elena Marinos' },
  user: { password: '123', displayName: 'Alex Doukas' },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<Session | null>(readStoredSession());

  readonly user = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly displayName = computed(() => this.session()?.displayName ?? '');
  readonly initials = computed(() => {
    const name = this.displayName();
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('');
  });

  /** Resolves to `true` on success. Simulates ~600 ms of network latency. */
  async login(username: string, password: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const record = CREDENTIALS[username.trim().toLowerCase()];
    if (!record || record.password !== password) return false;

    const session: Session = {
      username: username.trim().toLowerCase(),
      displayName: record.displayName,
      issuedAt: Date.now(),
    };
    this.session.set(session);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
    return true;
  }

  logout(): void {
    this.session.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
