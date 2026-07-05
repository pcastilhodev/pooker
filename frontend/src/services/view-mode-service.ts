import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PreferenceStore } from './preference-store';

export type ViewMode = 'grid' | 'list';
const KEY = 'looker:view-mode';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  private readonly store = inject(PreferenceStore);

  private readonly mode$: BehaviorSubject<ViewMode>;

  constructor() {
    this.mode$ = new BehaviorSubject<ViewMode>(this.store.get<ViewMode>(KEY, 'grid'));
  }

  get mode(): ViewMode { return this.mode$.value; }
  get modeObs$() { return this.mode$.asObservable(); }

  setMode(m: ViewMode): void { this.mode$.next(m); this.store.set(KEY, m); }
  toggle(): void { this.setMode(this.mode === 'grid' ? 'list' : 'grid'); }
}
