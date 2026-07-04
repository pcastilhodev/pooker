import { SurpriseService } from './surprise-service';

describe('SurpriseService', () => {
  let service: SurpriseService;

  beforeEach(() => {
    service = new SurpriseService();
  });

  it('starts closed', () => {
    let last: boolean | undefined;
    service.isOpen$.subscribe(v => (last = v));
    expect(last).toBeFalse();
  });

  it('open sets isOpen$ to true', () => {
    let last: boolean | undefined;
    service.isOpen$.subscribe(v => (last = v));

    service.open();
    expect(last).toBeTrue();
  });

  it('open is idempotent when already open', () => {
    let last: boolean | undefined;
    service.isOpen$.subscribe(v => (last = v));

    service.open();
    service.open();
    expect(last).toBeTrue();
  });

  it('close sets isOpen$ to false', () => {
    let last: boolean | undefined;
    service.isOpen$.subscribe(v => (last = v));

    service.open();
    service.close();
    expect(last).toBeFalse();
  });

  it('close is idempotent when already closed', () => {
    let last: boolean | undefined;
    service.isOpen$.subscribe(v => (last = v));

    service.close();
    expect(last).toBeFalse();
  });

  it('toggle flips the state from closed to open and back', () => {
    let last: boolean | undefined;
    service.isOpen$.subscribe(v => (last = v));

    service.toggle();
    expect(last).toBeTrue();

    service.toggle();
    expect(last).toBeFalse();
  });

  it('isOpen$ emits every state change to subscribers', () => {
    const emissions: boolean[] = [];
    service.isOpen$.subscribe(v => emissions.push(v));

    service.open();
    service.close();
    service.toggle();

    expect(emissions).toEqual([false, true, false, true]);
  });
});
