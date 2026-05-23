import { ThemeService } from './theme-service';
import { PreferenceStore } from './preference-store';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    service = new ThemeService(new PreferenceStore());
  });

  it('defaults to dark', () => {
    expect(service.theme).toBe('dark');
  });

  it('toggle switches to light and sets attribute', () => {
    service.toggle();
    expect(service.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggle back returns to dark', () => {
    service.toggle();
    service.toggle();
    expect(service.theme).toBe('dark');
  });

  it('themeObs$ emits current and future values', () => {
    const emitted: string[] = [];
    service.themeObs$.subscribe(t => emitted.push(t));
    service.toggle();
    service.toggle();
    expect(emitted).toEqual(['dark', 'light', 'dark']);
  });
});
