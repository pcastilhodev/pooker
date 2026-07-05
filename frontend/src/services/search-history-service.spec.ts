import { SearchHistoryService } from './search-history-service';

const STORAGE_KEY = 'looker:search-history';

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;

  beforeEach(() => {
    localStorage.clear();
    service = new SearchHistoryService();
  });

  it('starts empty when localStorage has nothing', () => {
    expect(service.list).toEqual([]);
  });

  it('push adds a trimmed term to the front of the list', () => {
    service.push('  inception  ');
    expect(service.list).toEqual(['inception']);
  });

  it('push ignores an empty or whitespace-only term', () => {
    service.push('   ');
    expect(service.list).toEqual([]);
  });

  it('push ignores a fully empty string', () => {
    service.push('');
    expect(service.list).toEqual([]);
  });

  it('push dedups case-insensitively, moving the term to the front', () => {
    service.push('Matrix');
    service.push('batman');
    service.push('MATRIX');
    expect(service.list).toEqual(['MATRIX', 'batman']);
  });

  it('push caps the list at MAX_ENTRIES (6)', () => {
    for (let i = 1; i <= 8; i++) {
      service.push(`term${i}`);
    }
    expect(service.list.length).toBe(6);
    expect(service.list[0]).toBe('term8');
    expect(service.list).not.toContain('term1');
    expect(service.list).not.toContain('term2');
  });

  it('push persists the list to localStorage', () => {
    service.push('dune');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(['dune']);
  });

  it('remove drops a term case-insensitively', () => {
    service.push('Dune');
    service.push('Arrival');
    service.remove('dune');
    expect(service.list).toEqual(['Arrival']);
  });

  it('remove persists the updated list', () => {
    service.push('Dune');
    service.remove('Dune');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw!)).toEqual([]);
  });

  it('remove is a no-op when the term is not present', () => {
    service.push('Dune');
    service.remove('unknown');
    expect(service.list).toEqual(['Dune']);
  });

  it('clear empties the list and persists', () => {
    service.push('Dune');
    service.push('Arrival');
    service.clear();
    expect(service.list).toEqual([]);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw!)).toEqual([]);
  });

  it('history$ emits the current list on push', () => {
    const emissions: string[][] = [];
    service.history$.subscribe(v => emissions.push(v));
    service.push('Dune');
    expect(emissions[emissions.length - 1]).toEqual(['Dune']);
  });

  it('history$ emits the current list on remove and clear', () => {
    service.push('Dune');
    const emissions: string[][] = [];
    service.history$.subscribe(v => emissions.push(v));
    service.remove('Dune');
    expect(emissions[emissions.length - 1]).toEqual([]);
    service.push('Arrival');
    service.clear();
    expect(emissions[emissions.length - 1]).toEqual([]);
  });

  it('reads pre-existing valid entries from localStorage on construction', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['old-term']));
    const svc = new SearchHistoryService();
    expect(svc.list).toEqual(['old-term']);
  });

  it('ignores corrupted (non-JSON) localStorage content and starts empty', () => {
    localStorage.setItem(STORAGE_KEY, '{not-valid-json');
    const svc = new SearchHistoryService();
    expect(svc.list).toEqual([]);
  });

  it('ignores non-array JSON content and starts empty', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    const svc = new SearchHistoryService();
    expect(svc.list).toEqual([]);
  });

  it('filters out non-string entries and caps at MAX_ENTRIES when reading', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['a', 1, 'b', null, 'c', 'd', 'e', 'f', 'g']));
    const svc = new SearchHistoryService();
    expect(svc.list).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });
});
