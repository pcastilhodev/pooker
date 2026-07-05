import { TestBed } from '@angular/core/testing';
import { CommentsService } from './comments-service';
import { AuthService } from './auth-service';

function makeJwt(payload: any): string {
  const b64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.signature`;
}

describe('CommentsService', () => {
  let auth: AuthService;
  let service: CommentsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
    service = TestBed.inject(CommentsService);
  });

  it('starts with no comments for a film', () => {
    expect(service.for(1)).toEqual([]);
  });

  it('add returns null when no user is logged in', () => {
    expect(service.add(1, 'texto')).toBeNull();
  });

  it('add returns null for blank text', () => {
    auth.setToken(makeJwt({ email: 'a@b.com', nome: 'Ana', exp: 9999999999 }));
    expect(service.add(1, '   ')).toBeNull();
  });

  it('add stores a comment for the logged-in user', () => {
    auth.setToken(makeJwt({ email: 'a@b.com', nome: 'Ana', exp: 9999999999 }));
    const comment = service.add(1, 'Ótimo filme');

    expect(comment).not.toBeNull();
    expect(service.for(1).length).toBe(1);
    expect(service.for(1)[0].author).toBe('Ana');
  });

  it('for sorts comments by most recent first', () => {
    auth.setToken(makeJwt({ email: 'a@b.com', nome: 'Ana', exp: 9999999999 }));
    let now = 1000;
    spyOn(Date, 'now').and.callFake(() => now++);
    service.add(1, 'primeiro');
    service.add(1, 'segundo');

    const result = service.for(1);
    expect(result[0].text).toBe('segundo');
  });

  it('byUser filters comments by email', () => {
    auth.setToken(makeJwt({ email: 'a@b.com', nome: 'Ana', exp: 9999999999 }));
    service.add(1, 'comentário');

    expect(service.byUser('a@b.com').length).toBe(1);
    expect(service.byUser('outro@b.com').length).toBe(0);
  });

  it('remove deletes only the owner comment', () => {
    auth.setToken(makeJwt({ email: 'a@b.com', nome: 'Ana', exp: 9999999999 }));
    const comment = service.add(1, 'comentário')!;
    service.remove(comment.id);

    expect(service.for(1).length).toBe(0);
  });

  it('remove does nothing when no user is logged in', () => {
    auth.setToken(makeJwt({ email: 'a@b.com', nome: 'Ana', exp: 9999999999 }));
    const comment = service.add(1, 'comentário')!;
    auth.logout();
    service.remove(comment.id);

    expect(service.for(1).length).toBe(1);
  });
});
