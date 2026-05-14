import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  readonly user = signal<User | null>(null);
  readonly ready = signal(false);
  readonly isAdmin = signal(false);

  constructor() {
    onAuthStateChanged(this.auth, (u) => {
      this.user.set(u);
      this.ready.set(true);
    });
    onIdTokenChanged(this.auth, async (u) => {
      if (!u) {
        this.isAdmin.set(false);
        return;
      }
      const tokenResult = await u.getIdTokenResult();
      this.isAdmin.set(tokenResult.claims['admin'] === true);
    });
  }

  async signUp(email: string, password: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  async signIn(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  async refreshClaims(): Promise<void> {
    const u = this.auth.currentUser;
    if (!u) return;
    const tokenResult = await u.getIdTokenResult(true);
    this.isAdmin.set(tokenResult.claims['admin'] === true);
  }

  async getIdToken(): Promise<string | null> {
    const u = this.auth.currentUser;
    return u ? u.getIdToken() : null;
  }
}
