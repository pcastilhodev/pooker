import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PreferenceStore } from './preference-store';

type Theme = 'dark' | 'light';
const KEY = 'looker:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly store = inject(PreferenceStore);

  private readonly theme$: BehaviorSubject<Theme>;

  constructor() {
    this.theme$ = new BehaviorSubject<Theme>(this.store.get<Theme>(KEY, 'dark'));
    this.apply(this.theme$.value);
  }

  get theme(): Theme { return this.theme$.value; }
  get themeObs$() { return this.theme$.asObservable(); }

  toggle(): void {
    const next: Theme = this.theme$.value === 'dark' ? 'light' : 'dark';
    this.theme$.next(next);
    this.store.set(KEY, next);
    this.apply(next);
  }

  private apply(t: Theme): void {
    document.documentElement.dataset['theme'] = t;
  }
}
