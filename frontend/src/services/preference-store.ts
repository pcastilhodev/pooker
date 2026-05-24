import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreferenceStore {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage full — ignore */ }
  }

  clear(key: string): void {
    localStorage.removeItem(key);
  }
}
