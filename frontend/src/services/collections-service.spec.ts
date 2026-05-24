import { CollectionsService } from './collections-service';

describe('CollectionsService', () => {
  let service: CollectionsService;

  beforeEach(() => { localStorage.clear(); service = new CollectionsService(); });

  it('starts empty', () => { expect(service.getAll().length).toBe(0); });

  it('creates collection with name', () => {
    service.create('Maratona');
    expect(service.getAll()[0].name).toBe('Maratona');
  });

  it('addFilm adds filmId to collection', () => {
    service.create('Test');
    const id = service.getAll()[0].id;
    service.addFilm(id, 42);
    expect(service.getAll()[0].filmIds).toContain(42);
  });

  it('removeFilm removes filmId', () => {
    service.create('Test');
    const id = service.getAll()[0].id;
    service.addFilm(id, 42);
    service.removeFilm(id, 42);
    expect(service.getAll()[0].filmIds).not.toContain(42);
  });

  it('delete removes collection', () => {
    service.create('Del');
    const id = service.getAll()[0].id;
    service.delete(id);
    expect(service.getAll().length).toBe(0);
  });
});
