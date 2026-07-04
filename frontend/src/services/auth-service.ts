import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const TOKEN_KEY = 'jwt';

export interface AuthUser {
  nome: string;
  email: string;
  role?: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
  sub?: string;
  exp?: number;
}

export interface JwtPayload {
  exp?: number;
  sub?: string;
  email?: string;
  nome?: string;
  name?: string;
  role?: string;
  roles?: string;
  cpf?: string;
  telefone?: string;
  phone?: string;
  data_nascimento?: string;
  birthDate?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<AuthUser | null>(this.readUser());

  user$: Observable<AuthUser | null> = this.currentUser$.asObservable();

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get user(): AuthUser | null {
    return this.currentUser$.value;
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.currentUser$.next(this.readUser());
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser$.next(null);
  }

  refresh() {
    this.currentUser$.next(this.readUser());
  }

  private readUser(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = decodeJwt(token);
    if (!payload) return null;
    if (this.isTokenExpired(payload.exp)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return this.buildUser(payload);
  }

  private isTokenExpired(exp: number | undefined): boolean {
    return !!exp && exp * 1000 < Date.now();
  }

  private buildUser(payload: JwtPayload): AuthUser {
    return {
      nome:             payload.nome ?? payload.name ?? deriveNameFromEmail(payload.email ?? payload.sub),
      email:            payload.email ?? payload.sub ?? '',
      role:             payload.role ?? payload.roles,
      cpf:              payload.cpf,
      telefone:         payload.telefone ?? payload.phone,
      data_nascimento:  payload.data_nascimento ?? payload.birthDate,
      sub:              payload.sub,
      exp:              payload.exp,
    };
  }
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    const json = decodeURIComponent(
      decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function deriveNameFromEmail(value?: string): string {
  if (!value) return 'Usuário';
  const localPart = value.split('@')[0];
  if (!localPart) return 'Usuário';
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
