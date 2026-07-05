import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites-service';
import { AuthService } from './auth-service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
  });

  it('starts empty', () => {
    expect(service.list).toEqual([]);
    expect(service.isFavorite(1)).toBeFalse();
  });

  it('toggle adds a film and returns true', () => {
    const result = service.toggle(1);
    expect(result).toBeTrue();
    expect(service.isFavorite(1)).toBeTrue();
  });

  it('toggle removes an already-favorite film and returns false', () => {
    service.toggle(1);
    const result = service.toggle(1);
    expect(result).toBeFalse();
    expect(service.isFavorite(1)).toBeFalse();
  });

  it('clear empties the list', () => {
    service.toggle(1);
    service.toggle(2);
    service.clear();
    expect(service.list).toEqual([]);
  });

  it('persists favorites across instances for the same storage key', () => {
    service.toggle(5);
    const other = TestBed.runInInjectionContext(() => new FavoritesService());
    expect(other.isFavorite(5)).toBeTrue();
  });

  it('ignores corrupted storage data', () => {
    localStorage.setItem('looker:favorites:guest', '{not json');
    const other = TestBed.runInInjectionContext(() => new FavoritesService());
    expect(other.list).toEqual([]);
  });
});
