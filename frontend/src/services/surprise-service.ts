import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SurpriseService {
  private open$ = new BehaviorSubject<boolean>(false);
  isOpen$ = this.open$.asObservable();

  open() { this.open$.next(true); }
  close() { this.open$.next(false); }
  toggle() { this.open$.next(!this.open$.value); }
}
