import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { gsap } from 'gsap';
import { App } from './app';
import { ShortcutsService } from '../services/shortcuts-service';
import { SurpriseService } from '../services/surprise-service';
import { ToastService } from '../services/toast-service';

// Mirrors the private `konamiSeq` in app.ts — used to drive the easter egg from tests.
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
// Mirrors the private `G_LEADER_TIMEOUT` constant in app.ts.
const G_LEADER_TIMEOUT = 1200;

function dispatchKey(key: string, init: KeyboardEventInit = {}, target: EventTarget = document): KeyboardEvent {
  const evt = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(evt);
  return evt;
}

function pressSequence(keys: string[], init: KeyboardEventInit = {}) {
  keys.forEach(key => dispatchKey(key, init));
}

function stubMatchMedia(matches: boolean) {
  spyOn(globalThis, 'matchMedia').and.returnValue({
    matches,
    media: '',
    onchange: null,
    addListener: () => { /* noop */ },
    removeListener: () => { /* noop */ },
    addEventListener: () => { /* noop */ },
    removeEventListener: () => { /* noop */ },
    dispatchEvent: () => false,
  } as unknown as MediaQueryList);
}

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let router: Router;
  let shortcutsSpy: jasmine.SpyObj<ShortcutsService>;
  let surpriseSpy: jasmine.SpyObj<SurpriseService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let surpriseSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    surpriseSubject = new BehaviorSubject<boolean>(false);

    shortcutsSpy = jasmine.createSpyObj('ShortcutsService', ['toggleHelp', 'openHelp', 'closeHelp', 'requestSearchFocus']);
    surpriseSpy = jasmine.createSpyObj('SurpriseService', ['open', 'close', 'toggle']);
    Object.defineProperty(surpriseSpy, 'isOpen$', { value: surpriseSubject.asObservable(), configurable: true });
    toastSpy = jasmine.createSpyObj('ToastService', ['show', 'success', 'error', 'warn', 'info']);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ShortcutsService, useValue: shortcutsSpy },
        { provide: SurpriseService, useValue: surpriseSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
  });

  afterEach(() => {
    document.documentElement.classList.remove('cinema-classic');
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor / surprise-me wiring', () => {
    it('should start with surpriseOpen = false', () => {
      expect(component.surpriseOpen).toBeFalse();
    });

    it('should reflect surprise.isOpen$ emissions on surpriseOpen', () => {
      surpriseSubject.next(true);
      expect(component.surpriseOpen).toBeTrue();

      surpriseSubject.next(false);
      expect(component.surpriseOpen).toBeFalse();
    });

    it('closeSurprise should delegate to surprise.close()', () => {
      component.closeSurprise();
      expect(surpriseSpy.close).toHaveBeenCalled();
    });

    it('keeps reacting to isOpen$ after ngOnDestroy (constructor subscription is never torn down)', () => {
      // Documents current behavior: the constructor subscribes to surprise.isOpen$ but
      // never stores/unsubscribes it in ngOnDestroy, so updates keep flowing after destroy.
      component.ngOnDestroy();
      surpriseSubject.next(true);
      expect(component.surpriseOpen).toBeTrue();
    });
  });

  describe('onKey — global shortcuts', () => {
    it('"?" should preventDefault and toggle the shortcuts help panel', () => {
      const evt = dispatchKey('?');
      expect((evt as unknown as { defaultPrevented: boolean }).defaultPrevented).toBeTrue();
      expect(shortcutsSpy.toggleHelp).toHaveBeenCalled();
    });

    it('"/" should preventDefault and request search focus', () => {
      const evt = dispatchKey('/');
      expect((evt as unknown as { defaultPrevented: boolean }).defaultPrevented).toBeTrue();
      expect(shortcutsSpy.requestSearchFocus).toHaveBeenCalled();
    });

    it('"Escape" should close the shortcuts help panel', () => {
      dispatchKey('Escape');
      expect(shortcutsSpy.closeHelp).toHaveBeenCalled();
    });

    it('"Escape" should close help even when focus is on an input (bypasses typing-target guard)', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      dispatchKey('Escape', {}, input);

      expect(shortcutsSpy.closeHelp).toHaveBeenCalled();
      input.remove();
    });

    it('should ignore non-Escape keys when the event target is an INPUT', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      dispatchKey('/', {}, input);

      expect(shortcutsSpy.requestSearchFocus).not.toHaveBeenCalled();
      input.remove();
    });

    it('should ignore non-Escape keys when the event target is a TEXTAREA', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      dispatchKey('?', {}, textarea);

      expect(shortcutsSpy.toggleHelp).not.toHaveBeenCalled();
      textarea.remove();
    });

    it('should ignore non-Escape keys when the event target is a SELECT', () => {
      const select = document.createElement('select');
      document.body.appendChild(select);

      dispatchKey('/', {}, select);

      expect(shortcutsSpy.requestSearchFocus).not.toHaveBeenCalled();
      select.remove();
    });

    it('should ignore non-Escape keys when the event target is contentEditable', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);

      dispatchKey('/', {}, div);

      expect(shortcutsSpy.requestSearchFocus).not.toHaveBeenCalled();
      div.remove();
    });

    it('should ignore keys pressed with a modifier (ctrlKey)', () => {
      dispatchKey('/', { ctrlKey: true });
      expect(shortcutsSpy.requestSearchFocus).not.toHaveBeenCalled();
    });

    it('should ignore keys pressed with a modifier (metaKey)', () => {
      dispatchKey('?', { metaKey: true });
      expect(shortcutsSpy.toggleHelp).not.toHaveBeenCalled();
    });

    it('should ignore keys pressed with a modifier (altKey)', () => {
      dispatchKey('/', { altKey: true });
      expect(shortcutsSpy.requestSearchFocus).not.toHaveBeenCalled();
    });
  });

  describe('onKey — "g" leader navigation', () => {
    it('"g" (no shift) should preventDefault and arm the leader state', () => {
      const evt = dispatchKey('g');
      expect((evt as unknown as { defaultPrevented: boolean }).defaultPrevented).toBeTrue();
    });

    it('"g" with shiftKey should NOT arm the leader state', () => {
      dispatchKey('g', { shiftKey: true });
      dispatchKey('h');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    (
      [
        ['h', '/'],
        ['f', '/favoritos'],
        ['w', '/watchlist'],
        ['r', '/meus-alugueis'],
        ['p', '/profile'],
      ] as const
    ).forEach(([key, path]) => {
      it(`"g" then "${key}" should navigate to "${path}"`, () => {
        dispatchKey('g');
        dispatchKey(key);
        expect(router.navigateByUrl).toHaveBeenCalledWith(path);
      });
    });

    it('"g" then an unmapped letter should not navigate', () => {
      dispatchKey('g');
      dispatchKey('z');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should still navigate when the follow-up key arrives before the leader timeout', fakeAsync(() => {
      dispatchKey('g');
      tick(G_LEADER_TIMEOUT - 200);
      dispatchKey('h');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    }));

    it('should NOT navigate when the follow-up key arrives after the leader timeout', fakeAsync(() => {
      dispatchKey('g');
      tick(G_LEADER_TIMEOUT);
      dispatchKey('h');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    }));
  });

  describe('onKey — Konami code', () => {
    it('should toggle cinema mode ON after the full correct sequence', () => {
      pressSequence(KONAMI);

      expect(component.cinemaMode).toBeTrue();
      expect(document.documentElement.classList.contains('cinema-classic')).toBeTrue();
      expect(toastSpy.success).toHaveBeenCalledWith('🎞️ Modo Cinema Clássico ativado', 'Easter egg!');
    });

    it('should toggle cinema mode OFF when the sequence is entered a second time', () => {
      pressSequence(KONAMI);
      pressSequence(KONAMI);

      expect(component.cinemaMode).toBeFalse();
      expect(document.documentElement.classList.contains('cinema-classic')).toBeFalse();
      expect(toastSpy.info).toHaveBeenCalledWith('Modo Cinema Clássico desativado');
    });

    it('a wrong key should fully reset progress, requiring the sequence to restart', () => {
      pressSequence(['ArrowUp', 'ArrowUp', 'ArrowDown']); // partial progress
      dispatchKey('x'); // wrong key, not equal to seq[0] either -> resets to 0

      pressSequence(KONAMI);

      expect(toastSpy.success).toHaveBeenCalledTimes(1);
      expect(component.cinemaMode).toBeTrue();
    });

    it('a wrong key matching seq[0] should restart progress at index 1, and the sequence can still complete', () => {
      pressSequence(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft']); // idx now 5, expects 'ArrowRight'
      dispatchKey('ArrowUp'); // wrong for idx 5, but equals seq[0] -> idx becomes 1

      // Continue from idx 1: konamiSeq[1..9]
      pressSequence(['ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']);

      expect(component.cinemaMode).toBeTrue();
      expect(toastSpy.success).toHaveBeenCalledTimes(1);
    });

    it('should match the trailing letters case-insensitively', () => {
      pressSequence([...KONAMI.slice(0, 8), 'B', 'A']);

      expect(component.cinemaMode).toBeTrue();
      expect(toastSpy.success).toHaveBeenCalledTimes(1);
    });

    it('should keep tracking progress even for keys that onKey otherwise ignores (modifiers / typing targets)', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      pressSequence(KONAMI.slice(0, 8)); // arrows/directions on document
      dispatchKey('b', { ctrlKey: true }, input); // ignored by onKey's guard, but still tracked
      dispatchKey('a', {}, input);

      expect(component.cinemaMode).toBeTrue();
      expect(toastSpy.success).toHaveBeenCalledTimes(1);
      input.remove();
    });
  });

  describe('ngAfterViewInit', () => {
    beforeEach(() => {
      // app.html renders a real <canvas id="grain"> that TestBed inserts into
      // the live document as soon as the fixture is created, even without
      // detectChanges(). Remove it so each test starts from a clean slate and
      // any canvas it manually creates/appends is the only '#grain' match.
      document.getElementById('grain')?.remove();
    });

    afterEach(() => {
      document.getElementById('grain')?.remove();
    });

    it('should zero-out gsap default duration when prefers-reduced-motion matches', () => {
      stubMatchMedia(true);
      const defaultsSpy = spyOn(gsap, 'defaults');
      spyOn(window, 'requestAnimationFrame').and.returnValue(0);

      component.ngAfterViewInit();

      expect(defaultsSpy).toHaveBeenCalledWith({ duration: 0 });
    });

    it('should NOT touch gsap defaults when prefers-reduced-motion does not match', () => {
      stubMatchMedia(false);
      const defaultsSpy = spyOn(gsap, 'defaults');
      spyOn(window, 'requestAnimationFrame').and.returnValue(0);

      component.ngAfterViewInit();

      expect(defaultsSpy).not.toHaveBeenCalled();
    });

    it('should do nothing for the grain canvas when it is not present in the document', () => {
      stubMatchMedia(false);
      const addListenerSpy = spyOn(window, 'addEventListener').and.callThrough();
      spyOn(window, 'requestAnimationFrame').and.returnValue(0);

      component.ngAfterViewInit();

      expect(addListenerSpy).not.toHaveBeenCalledWith('resize', jasmine.any(Function), jasmine.anything());
    });

    it('should do nothing for the grain canvas when 2D context is unavailable', () => {
      stubMatchMedia(false);
      const canvas = document.createElement('canvas');
      canvas.id = 'grain';
      document.body.appendChild(canvas);
      spyOn(HTMLCanvasElement.prototype, 'getContext').and.returnValue(null);
      const addListenerSpy = spyOn(window, 'addEventListener').and.callThrough();
      spyOn(window, 'requestAnimationFrame').and.returnValue(0);

      component.ngAfterViewInit();

      expect(addListenerSpy).not.toHaveBeenCalledWith('resize', jasmine.any(Function), jasmine.anything());
    });

    it('should wire up the resize listener and schedule an animation frame when the canvas is present', () => {
      stubMatchMedia(false);
      const canvas = document.createElement('canvas');
      canvas.id = 'grain';
      document.body.appendChild(canvas);
      const rafSpy = spyOn(window, 'requestAnimationFrame').and.returnValue(42);
      const addListenerSpy = spyOn(window, 'addEventListener').and.callThrough();

      component.ngAfterViewInit();

      expect(addListenerSpy).toHaveBeenCalledWith('resize', jasmine.any(Function), { passive: true });
      expect(rafSpy).toHaveBeenCalled();
      expect(canvas.width).toBe(window.innerWidth);
      expect(canvas.height).toBe(window.innerHeight);
    });

    it('should draw grain only every third animation frame', () => {
      stubMatchMedia(false);
      const canvas = document.createElement('canvas');
      canvas.id = 'grain';
      document.body.appendChild(canvas);
      const putImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'putImageData');

      let rafCallCount = 0;
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
        rafCallCount++;
        if (rafCallCount <= 3) cb(0);
        return rafCallCount;
      });

      component.ngAfterViewInit();

      expect(putImageDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should skip drawing when the canvas has zero width/height', () => {
      stubMatchMedia(false);
      const canvas = document.createElement('canvas');
      canvas.id = 'grain';
      document.body.appendChild(canvas);
      const putImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'putImageData');

      const widthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
      const heightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
      Object.defineProperty(window, 'innerWidth', { value: 0, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 0, configurable: true });

      let rafCallCount = 0;
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
        rafCallCount++;
        if (rafCallCount <= 3) cb(0);
        return rafCallCount;
      });

      component.ngAfterViewInit();

      expect(putImageDataSpy).not.toHaveBeenCalled();

      if (widthDescriptor) Object.defineProperty(window, 'innerWidth', widthDescriptor);
      if (heightDescriptor) Object.defineProperty(window, 'innerHeight', heightDescriptor);
    });
  });

  describe('ngOnDestroy', () => {
    afterEach(() => {
      document.getElementById('grain')?.remove();
    });

    it('should not throw when called without a prior ngAfterViewInit', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should remove the resize listener and cancel the animation frame set up in ngAfterViewInit', () => {
      stubMatchMedia(false);
      const canvas = document.createElement('canvas');
      canvas.id = 'grain';
      document.body.appendChild(canvas);
      spyOn(window, 'requestAnimationFrame').and.returnValue(77);
      const removeListenerSpy = spyOn(window, 'removeEventListener').and.callThrough();
      const cancelSpy = spyOn(window, 'cancelAnimationFrame');

      component.ngAfterViewInit();
      component.ngOnDestroy();

      expect(removeListenerSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));
      expect(cancelSpy).toHaveBeenCalledWith(77);
    });

    it('should clear the pending g-leader timeout on destroy', fakeAsync(() => {
      dispatchKey('g');
      component.ngOnDestroy();
      tick(G_LEADER_TIMEOUT);
      // ngOnDestroy cancels the timer, so the gPending=false callback never
      // fires — gPending stays true. fakeAsync would fail this test on its
      // own if the timer were still pending (dangling) after the tick.
      expect(component['gPending']).toBeTrue();
    }));
  });
});
