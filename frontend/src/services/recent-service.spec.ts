import { TestBed } from '@angular/core/testing';
import { RecentService } from './recent-service';

describe('RecentService', () => {
  let service: RecentService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecentService);
  });

  it('starts empty', () => {
    expect(service.list).toEqual([]);
  });

  it('track adds a film id to the front of the list', () => {
    service.track(1);
    service.track(2);
    expect(service.list).toEqual([2, 1]);
  });

  it('track deduplicates and moves the id back to the front', () => {
    service.track(1);
    service.track(2);
    service.track(1);
    expect(service.list).toEqual([1, 2]);
  });

  it('track caps the list at 12 entries', () => {
    for (let i = 1; i <= 15; i++) service.track(i);
    expect(service.list.length).toBe(12);
    expect(service.list[0]).toBe(15);
  });

  it('clear empties the list', () => {
    service.track(1);
    service.clear();
    expect(service.list).toEqual([]);
  });

  it('persists across instances for the same storage key', () => {
    service.track(9);
    const other = TestBed.runInInjectionContext(() => new RecentService());
    expect(other.list).toEqual([9]);
  });

  it('ignores corrupted storage data', () => {
    localStorage.setItem('looker:recent:guest', 'not json');
    const other = TestBed.runInInjectionContext(() => new RecentService());
    expect(other.list).toEqual([]);
  });
});
