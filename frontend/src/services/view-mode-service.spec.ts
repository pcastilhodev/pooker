import { TestBed } from '@angular/core/testing';
import { ViewModeService } from './view-mode-service';
import { PreferenceStore } from './preference-store';

describe('ViewModeService', () => {
  let service: ViewModeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [ViewModeService, PreferenceStore] });
    service = TestBed.inject(ViewModeService);
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
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ViewModeService, PreferenceStore] });
    const service2 = TestBed.inject(ViewModeService);
    expect(service2.mode).toBe('list');
  });

  it('modeObs$ emits changes', () => {
    const emitted: string[] = [];
    service.modeObs$.subscribe(m => emitted.push(m));
    service.toggle();
    expect(emitted).toEqual(['grid', 'list']);
  });
});
