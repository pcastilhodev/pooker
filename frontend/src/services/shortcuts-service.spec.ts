import { ShortcutsService } from './shortcuts-service';

describe('ShortcutsService', () => {
  let service: ShortcutsService;

  beforeEach(() => {
    service = new ShortcutsService();
  });

  it('exposes the static list of shortcut definitions', () => {
    expect(service.defs.length).toBeGreaterThan(0);
    expect(service.defs.some(d => d.combo === '?')).toBeTrue();
    expect(service.defs.some(d => d.combo === '/')).toBeTrue();
    expect(service.defs.every(d => ['Navegação', 'Busca', 'Geral'].includes(d.category))).toBeTrue();
  });

  it('helpVisible$ starts as false', () => {
    let last: boolean | undefined;
    service.helpVisible$.subscribe(v => (last = v));
    expect(last).toBeFalse();
  });

  it('toggleHelp flips the visibility state', () => {
    let last = false;
    service.helpVisible$.subscribe(v => (last = v));

    service.toggleHelp();
    expect(last).toBeTrue();

    service.toggleHelp();
    expect(last).toBeFalse();
  });

  it('openHelp sets visibility to true regardless of current state', () => {
    let last = false;
    service.helpVisible$.subscribe(v => (last = v));

    service.openHelp();
    expect(last).toBeTrue();

    service.openHelp();
    expect(last).toBeTrue();
  });

  it('closeHelp sets visibility to false regardless of current state', () => {
    let last = false;
    service.helpVisible$.subscribe(v => (last = v));

    service.openHelp();
    service.closeHelp();
    expect(last).toBeFalse();

    service.closeHelp();
    expect(last).toBeFalse();
  });

  it('requestSearchFocus emits on searchFocusRequest$ to active subscribers', () => {
    let count = 0;
    service.searchFocusRequest$.subscribe(() => count++);

    service.requestSearchFocus();
    expect(count).toBe(1);

    service.requestSearchFocus();
    service.requestSearchFocus();
    expect(count).toBe(3);
  });

  it('searchFocusRequest$ does not replay past emissions to late subscribers (Subject, not BehaviorSubject)', () => {
    service.requestSearchFocus();

    let count = 0;
    service.searchFocusRequest$.subscribe(() => count++);
    expect(count).toBe(0);
  });
});
