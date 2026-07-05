import { SearchHistoryService } from './search-history-service';

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;

  beforeEach(() => { localStorage.clear(); service = new SearchHistoryService(); });

  it('starts empty', () => { expect(service.list).toEqual([]); });

  it('push adds a term to the front', () => {
    service.push('matrix');
    service.push('duna');
    expect(service.list).toEqual(['duna', 'matrix']);
  });

  it('push ignores blank terms', () => {
    service.push('   ');
    expect(service.list).toEqual([]);
  });

  it('push deduplicates case-insensitively and moves term to front', () => {
    service.push('Matrix');
    service.push('duna');
    service.push('matrix');
    expect(service.list).toEqual(['matrix', 'duna']);
  });

  it('push caps the list at 6 entries', () => {
    for (let i = 1; i <= 8; i++) service.push(`termo${i}`);
    expect(service.list.length).toBe(6);
  });

  it('remove drops a term case-insensitively', () => {
    service.push('Matrix');
    service.remove('matrix');
    expect(service.list).toEqual([]);
  });

  it('clear empties the list', () => {
    service.push('matrix');
    service.clear();
    expect(service.list).toEqual([]);
  });

  it('ignores corrupted storage data', () => {
    localStorage.setItem('looker:search-history', 'not json');
    const other = new SearchHistoryService();
    expect(other.list).toEqual([]);
  });
});
