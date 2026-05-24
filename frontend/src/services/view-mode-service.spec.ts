import { ViewModeService } from './view-mode-service';
import { PreferenceStore } from './preference-store';

describe('ViewModeService', () => {
  let service: ViewModeService;

  beforeEach(() => {
    localStorage.clear();
    service = new ViewModeService(new PreferenceStore());
  });

  it('defaults to grid', () => {
    expect(service.mode).toBe('grid');
  });

  it('toggle switches to list', () => {
    service.toggle();
    expect(service.mode).toBe('list');
  });

  it('setMode persists preference', () => {
    service.setMode('list');
    const service2 = new ViewModeService(new PreferenceStore());
    expect(service2.mode).toBe('list');
  });

  it('modeObs$ emits changes', () => {
    const emitted: string[] = [];
    service.modeObs$.subscribe(m => emitted.push(m));
    service.toggle();
    expect(emitted).toEqual(['grid', 'list']);
  });
});
