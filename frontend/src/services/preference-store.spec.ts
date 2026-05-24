import { PreferenceStore } from './preference-store';

describe('PreferenceStore', () => {
  let store: PreferenceStore;

  beforeEach(() => {
    localStorage.clear();
    store = new PreferenceStore();
  });

  it('returns default when key absent', () => {
    expect(store.get('x', 'def')).toBe('def');
  });

  it('persists and retrieves typed value', () => {
    store.set('theme', 'dark');
    expect(store.get('theme', 'light')).toBe('dark');
  });

  it('clear removes key', () => {
    store.set('k', 'v');
    store.clear('k');
    expect(store.get('k', 'fallback')).toBe('fallback');
  });
});
