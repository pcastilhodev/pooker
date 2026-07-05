import { ShortcutsService } from './shortcuts-service';

describe('ShortcutsService', () => {
  let service: ShortcutsService;

  beforeEach(() => { service = new ShortcutsService(); });

  it('exposes a non-empty list of shortcut definitions', () => {
    expect(service.defs.length).toBeGreaterThan(0);
  });

  it('help panel starts closed', (done) => {
    service.helpVisible$.subscribe(open => { expect(open).toBeFalse(); done(); });
  });

  it('openHelp opens the panel', (done) => {
    service.openHelp();
    service.helpVisible$.subscribe(open => { expect(open).toBeTrue(); done(); });
  });

  it('closeHelp closes the panel', (done) => {
    service.openHelp();
    service.closeHelp();
    service.helpVisible$.subscribe(open => { expect(open).toBeFalse(); done(); });
  });

  it('toggleHelp flips the current state', (done) => {
    service.toggleHelp();
    service.helpVisible$.subscribe(open => { expect(open).toBeTrue(); done(); });
  });

  it('requestSearchFocus emits on searchFocusRequest$', (done) => {
    service.searchFocusRequest$.subscribe(() => { expect(true).toBeTrue(); done(); });
    service.requestSearchFocus();
  });
});
