import { CompareService } from './compare-service';

describe('CompareService', () => {
  let service: CompareService;

  beforeEach(() => { sessionStorage.clear(); service = new CompareService(); });

  it('starts empty', () => { expect(service.ids.length).toBe(0); });
  it('add stores filmId', () => { service.add(1); expect(service.ids).toContain(1); });
  it('add ignores duplicate', () => { service.add(1); service.add(1); expect(service.ids.length).toBe(1); });
  it('add ignores third film', () => { service.add(1); service.add(2); service.add(3); expect(service.ids.length).toBe(2); });
  it('remove drops filmId', () => { service.add(1); service.add(2); service.remove(1); expect(service.ids).not.toContain(1); });
  it('canAdd is false when 2 films stored', () => { service.add(1); service.add(2); expect(service.canAdd).toBeFalse(); });
  it('clear empties list', () => { service.add(1); service.add(2); service.clear(); expect(service.ids.length).toBe(0); });
});
