import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ShortcutDef {
  combo: string;
  label: string;
  category: 'Navegação' | 'Busca' | 'Geral';
}

const SHORTCUTS: ShortcutDef[] = [
  { combo: '?',     label: 'Mostrar/ocultar este painel',  category: 'Geral' },
  { combo: 'Esc',   label: 'Fechar painéis/menus abertos', category: 'Geral' },
  { combo: '/',     label: 'Focar busca',                  category: 'Busca' },
  { combo: 'g h',   label: 'Ir para Início',               category: 'Navegação' },
  { combo: 'g f',   label: 'Ir para Favoritos',            category: 'Navegação' },
  { combo: 'g w',   label: 'Ir para Watchlist',            category: 'Navegação' },
  { combo: 'g r',   label: 'Ir para Meus aluguéis',        category: 'Navegação' },
  { combo: 'g p',   label: 'Ir para Meu perfil',           category: 'Navegação' },
];

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  readonly defs = SHORTCUTS;

  private helpOpen$ = new BehaviorSubject<boolean>(false);
  helpVisible$: Observable<boolean> = this.helpOpen$.asObservable();

  private focusSearch$ = new Subject<void>();
  searchFocusRequest$: Observable<void> = this.focusSearch$.asObservable();

  toggleHelp() { this.helpOpen$.next(!this.helpOpen$.value); }
  openHelp()   { this.helpOpen$.next(true); }
  closeHelp()  { this.helpOpen$.next(false); }

  requestSearchFocus() { this.focusSearch$.next(); }
}
