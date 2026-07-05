import { SurpriseService } from './surprise-service';

describe('SurpriseService', () => {
  let service: SurpriseService;

  beforeEach(() => { service = new SurpriseService(); });

  it('starts closed', (done) => {
    service.isOpen$.subscribe(open => { expect(open).toBeFalse(); done(); });
  });

  it('open sets state to true', (done) => {
    service.open();
    service.isOpen$.subscribe(open => { expect(open).toBeTrue(); done(); });
  });

  it('close sets state to false', (done) => {
    service.open();
    service.close();
    service.isOpen$.subscribe(open => { expect(open).toBeFalse(); done(); });
  });

  it('toggle flips the current state twice', (done) => {
    service.toggle();
    service.toggle();
    service.isOpen$.subscribe(open => { expect(open).toBeFalse(); done(); });
  });
});
