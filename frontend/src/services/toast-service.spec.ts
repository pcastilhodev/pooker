import { ToastService } from './toast-service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => { service = new ToastService(); });

  it('starts with no toasts', (done) => {
    service.stream.subscribe(toasts => { expect(toasts).toEqual([]); done(); });
  });

  it('show adds a toast and returns its id', (done) => {
    const id = service.show('mensagem');
    service.stream.subscribe(toasts => {
      expect(toasts.length).toBe(1);
      expect(toasts[0].id).toBe(id);
      expect(toasts[0].kind).toBe('info');
      done();
    });
  });

  it('success/error/warn/info set the right kind', () => {
    service.success('a'); service.error('b'); service.warn('c'); service.info('d');
    let kinds: string[] = [];
    service.stream.subscribe(toasts => kinds = toasts.map(t => t.kind));
    expect(kinds).toEqual(['success', 'error', 'warn', 'info']);
  });

  it('dismiss removes a toast by id', () => {
    const id = service.show('mensagem');
    service.dismiss(id);
    let toasts: any[] = [];
    service.stream.subscribe(t => toasts = t);
    expect(toasts).toEqual([]);
  });

  it('auto-dismisses after the timeout elapses', () => {
    let capturedFn: () => void = () => {};
    spyOn(window, 'setTimeout').and.callFake((fn: any) => { capturedFn = fn; return 0 as any; });

    service.show('mensagem', 'info', undefined, 1000);
    capturedFn();

    let toasts: any[] = [];
    service.stream.subscribe(t => toasts = t);
    expect(toasts).toEqual([]);
  });

  it('does not auto-dismiss when timeoutMs is 0', () => {
    spyOn(window, 'setTimeout');
    service.show('mensagem', 'info', undefined, 0);

    expect(window.setTimeout).not.toHaveBeenCalled();
    let toasts: any[] = [];
    service.stream.subscribe(t => toasts = t);
    expect(toasts.length).toBe(1);
  });
});
