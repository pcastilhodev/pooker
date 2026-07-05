import { TestBed } from '@angular/core/testing';
import { WatchlistService } from './watchlist-service';

describe('WatchlistService', () => {
  let service: WatchlistService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(WatchlistService);
  });

  it('starts empty', () => {
    expect(service.entries).toEqual([]);
    expect(service.ids).toEqual([]);
    expect(service.has(1)).toBeFalse();
  });

  it('toggle adds an entry and returns true', () => {
    const added = service.toggle(1);
    expect(added).toBeTrue();
    expect(service.has(1)).toBeTrue();
    expect(service.ids).toEqual([1]);
  });

  it('toggle removes an existing entry and returns false', () => {
    service.toggle(1);
    const added = service.toggle(1);
    expect(added).toBeFalse();
    expect(service.has(1)).toBeFalse();
  });

  it('remove drops a specific entry', () => {
    service.toggle(1);
    service.toggle(2);
    service.remove(1);
    expect(service.ids).toEqual([2]);
  });

  it('clear empties the list', () => {
    service.toggle(1);
    service.toggle(2);
    service.clear();
    expect(service.entries).toEqual([]);
  });

  it('persists entries across instances for the same storage key', () => {
    service.toggle(7);
    const other = TestBed.runInInjectionContext(() => new WatchlistService());
    expect(other.has(7)).toBeTrue();
  });

  it('ignores corrupted storage data', () => {
    localStorage.setItem('looker:watchlist:guest', 'not json');
    const other = TestBed.runInInjectionContext(() => new WatchlistService());
    expect(other.entries).toEqual([]);
  });
});
