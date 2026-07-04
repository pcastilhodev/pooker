import { TestBed } from '@angular/core/testing';
import { CommentsService, MovieComment } from './comments-service';
import { AuthService, JwtPayload } from './auth-service';

const STORAGE_KEY = 'looker:comments';
const FUTURE = Math.floor(Date.now() / 1000) + 10_000;

function makeToken(payload: JwtPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `header.${b64}.signature`;
}

function login(auth: AuthService, email: string, nome: string): void {
  auth.setToken(makeToken({ email, nome, exp: FUTURE }));
}

describe('CommentsService', () => {
  let service: CommentsService;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [CommentsService, AuthService] });
    service = TestBed.inject(CommentsService);
    auth = TestBed.inject(AuthService);
  });

  it('for() returns an empty array when there are no comments', () => {
    expect(service.for(1)).toEqual([]);
  });

  it('byUser() returns an empty array when the user has no comments', () => {
    expect(service.byUser('nobody@example.com')).toEqual([]);
  });

  describe('add()', () => {
    it('returns null when nobody is logged in', () => {
      expect(service.add(1, 'hello')).toBeNull();
      expect(service.for(1)).toEqual([]);
    });

    it('returns null when the text is empty or whitespace-only', () => {
      login(auth, 'a@b.com', 'Ana');
      expect(service.add(1, '   ')).toBeNull();
      expect(service.add(1, '')).toBeNull();
      expect(service.for(1)).toEqual([]);
    });

    it('creates a comment with author/email from the logged-in user', () => {
      login(auth, 'ana@example.com', 'Ana Silva');
      const comment = service.add(7, 'Ótimo filme!');
      expect(comment).not.toBeNull();
      expect(comment?.filmeId).toBe(7);
      expect(comment?.author).toBe('Ana Silva');
      expect(comment?.email).toBe('ana@example.com');
      expect(comment?.text).toBe('Ótimo filme!');
      expect(typeof comment?.id).toBe('number');
      expect(typeof comment?.ts).toBe('number');
    });

    it('trims surrounding whitespace and truncates text to 800 characters', () => {
      login(auth, 'a@b.com', 'Ana');
      const longText = '  ' + 'x'.repeat(900) + '  ';
      const comment = service.add(1, longText);
      expect(comment?.text.length).toBe(800);
      expect(comment?.text.startsWith('x')).toBeTrue();
    });

    it('persists comments to localStorage', () => {
      login(auth, 'a@b.com', 'Ana');
      service.add(1, 'hello');
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const stored = JSON.parse(raw as string) as MovieComment[];
      expect(stored.length).toBe(1);
      expect(stored[0].text).toBe('hello');
    });

    it('assigns increasing ids across multiple comments', () => {
      login(auth, 'a@b.com', 'Ana');
      const c1 = service.add(1, 'first');
      const c2 = service.add(1, 'second');
      expect(c2!.id).toBeGreaterThan(c1!.id);
    });

    it('computes the next id from previously persisted comments', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([
        { id: 5, filmeId: 1, author: 'X', email: 'x@x.com', text: 'old', ts: 1 },
        { id: 8, filmeId: 2, author: 'Y', email: 'y@y.com', text: 'old2', ts: 2 },
      ] as MovieComment[]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [CommentsService, AuthService] });
      const svc = TestBed.inject(CommentsService);
      const authSvc = TestBed.inject(AuthService);
      login(authSvc, 'a@b.com', 'Ana');

      const comment = svc.add(1, 'new comment');
      expect(comment?.id).toBe(9);
    });
  });

  describe('for()', () => {
    it('filters comments by filmeId and sorts them newest first', () => {
      login(auth, 'a@b.com', 'Ana');
      let now = 1000;
      spyOn(Date, 'now').and.callFake(() => now++);

      service.add(1, 'oldest');
      service.add(1, 'newest');
      service.add(2, 'other film');

      const forFilm1 = service.for(1);
      expect(forFilm1.length).toBe(2);
      expect(forFilm1[0].text).toBe('newest');
      expect(forFilm1[1].text).toBe('oldest');
    });
  });

  describe('byUser()', () => {
    it('returns only comments from the given user email', () => {
      login(auth, 'ana@example.com', 'Ana');
      service.add(1, 'from ana');
      login(auth, 'bob@example.com', 'Bob');
      service.add(1, 'from bob');

      const anaComments = service.byUser('ana@example.com');
      expect(anaComments.length).toBe(1);
      expect(anaComments[0].text).toBe('from ana');
    });
  });

  describe('remove()', () => {
    it('does nothing when nobody is logged in', () => {
      login(auth, 'ana@example.com', 'Ana');
      const comment = service.add(1, 'mine')!;
      auth.logout();
      service.remove(comment.id);
      expect(service.for(1).length).toBe(1);
    });

    it('removes a comment owned by the logged-in user', () => {
      login(auth, 'ana@example.com', 'Ana');
      const comment = service.add(1, 'mine')!;
      service.remove(comment.id);
      expect(service.for(1)).toEqual([]);
    });

    it('does not remove a comment belonging to a different user even with the same id', () => {
      login(auth, 'ana@example.com', 'Ana');
      const anaComment = service.add(1, 'ana comment')!;

      login(auth, 'bob@example.com', 'Bob');
      service.remove(anaComment.id);

      login(auth, 'ana@example.com', 'Ana');
      expect(service.for(1).find(c => c.id === anaComment.id)).toBeTruthy();
    });

    it('persists the removal', () => {
      login(auth, 'ana@example.com', 'Ana');
      const comment = service.add(1, 'mine')!;
      service.remove(comment.id);
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as MovieComment[];
      expect(raw.find(c => c.id === comment.id)).toBeUndefined();
    });
  });

  describe('corrupted storage', () => {
    it('read() falls back to an empty list on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json{{{');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [CommentsService, AuthService] });
      const svc = TestBed.inject(CommentsService);
      expect(svc.for(1)).toEqual([]);
    });
  });

  describe('persistence failure', () => {
    it('add() does not throw when localStorage.setItem fails', () => {
      login(auth, 'a@b.com', 'Ana');
      spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
      expect(() => service.add(1, 'hello')).not.toThrow();
      expect(service.for(1).length).toBe(1);
    });
  });
});
