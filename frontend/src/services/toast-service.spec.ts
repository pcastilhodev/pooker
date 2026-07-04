import { ToastService, Toast } from './toast-service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
  });

  it('starts with an empty stream', () => {
    let last: Toast[] = [];
    service.stream.subscribe(v => (last = v));
    expect(last).toEqual([]);
  });

  it('show adds a toast with default kind "info" and default timeoutMs', () => {
    jasmine.clock().install();
    try {
      const id = service.show('hello');
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));
      expect(id).toBe(1);
      expect(last.length).toBe(1);
      expect(last[0]).toEqual({ id: 1, kind: 'info', title: undefined, message: 'hello', timeoutMs: 4200 });
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('show accepts an explicit kind, title and timeoutMs', () => {
    jasmine.clock().install();
    try {
      const id = service.show('custom msg', 'warn', 'Heads up', 1000);
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));
      expect(last[0]).toEqual({ id, kind: 'warn', title: 'Heads up', message: 'custom msg', timeoutMs: 1000 });
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('show increments ids across calls', () => {
    jasmine.clock().install();
    try {
      const id1 = service.show('a');
      const id2 = service.show('b');
      expect(id2).toBe(id1 + 1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('success/error/warn/info helpers set the expected kind', () => {
    jasmine.clock().install();
    try {
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));

      service.success('ok msg', 'Success title');
      expect(last[last.length - 1].kind).toBe('success');
      expect(last[last.length - 1].title).toBe('Success title');

      service.error('err msg');
      expect(last[last.length - 1].kind).toBe('error');

      service.warn('warn msg');
      expect(last[last.length - 1].kind).toBe('warn');

      service.info('info msg');
      expect(last[last.length - 1].kind).toBe('info');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('dismiss removes the toast with the matching id', () => {
    jasmine.clock().install();
    try {
      const id1 = service.show('a', 'info', undefined, 0);
      const id2 = service.show('b', 'info', undefined, 0);
      service.dismiss(id1);
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));
      expect(last.map(t => t.id)).toEqual([id2]);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('dismiss with an unknown id is a no-op', () => {
    jasmine.clock().install();
    try {
      service.show('a', 'info', undefined, 0);
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));
      const before = last.length;
      service.dismiss(9999);
      expect(last.length).toBe(before);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('auto-dismisses the toast after timeoutMs elapses', () => {
    jasmine.clock().install();
    try {
      service.show('will vanish', 'info', undefined, 5000);
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));
      expect(last.length).toBe(1);

      jasmine.clock().tick(4999);
      expect(last.length).toBe(1);

      jasmine.clock().tick(1);
      expect(last.length).toBe(0);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('does not schedule an auto-dismiss when timeoutMs is 0', () => {
    jasmine.clock().install();
    try {
      service.show('persists', 'info', undefined, 0);
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));
      jasmine.clock().tick(100000);
      expect(last.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('does not schedule an auto-dismiss when timeoutMs is negative', () => {
    jasmine.clock().install();
    try {
      service.show('persists', 'info', undefined, -1);
      let last: Toast[] = [];
      service.stream.subscribe(v => (last = v));
      jasmine.clock().tick(100000);
      expect(last.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
