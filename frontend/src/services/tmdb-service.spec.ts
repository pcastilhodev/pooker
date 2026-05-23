import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TmdbService } from './tmdb-service';

describe('TmdbService', () => {
  let service: TmdbService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TmdbService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('getTrailerKey returns YouTube key from TMDB response', () => {
    let result: string | null = undefined!;
    service.getTrailerKey('Inception').subscribe(k => (result = k));

    const searchReq = httpMock.expectOne(r => r.url.includes('search/movie'));
    searchReq.flush({ results: [{ id: 27205 }] });

    const videoReq = httpMock.expectOne(r => r.url.includes('27205/videos'));
    videoReq.flush({ results: [{ type: 'Trailer', site: 'YouTube', key: 'abc123' }] });

    expect(result).toBe('abc123');
  });

  it('getTrailerKey returns null when no results', () => {
    let result: string | null = undefined!;
    service.getTrailerKey('Unknown Film XYZ').subscribe(k => (result = k));

    httpMock.expectOne(r => r.url.includes('search/movie')).flush({ results: [] });

    expect(result).toBeNull();
  });
});
