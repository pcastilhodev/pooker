import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const KEY = 'looker:compare';

@Injectable({ providedIn: 'root' })
export class CompareService {
  private ids$ = new BehaviorSubject<number[]>(this.load());
  idsObs$ = this.ids$.asObservable();

  get ids(): number[] { return this.ids$.value; }
  get canAdd(): boolean { return this.ids$.value.length < 2; }

  add(id: number): void {
    if (!this.canAdd || this.ids$.value.includes(id)) return;
    this.save([...this.ids$.value, id]);
  }

  remove(id: number): void { this.save(this.ids$.value.filter(i => i !== id)); }

  clear(): void { this.save([]); }

  isSelected(id: number): boolean { return this.ids$.value.includes(id); }

  private load(): number[] {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  private save(ids: number[]): void {
    this.ids$.next(ids);
    try { sessionStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  }
}
