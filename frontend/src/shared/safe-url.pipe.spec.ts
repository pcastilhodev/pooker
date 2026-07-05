import { TestBed } from '@angular/core/testing';
import { SafeUrlPipe } from './safe-url.pipe';

describe('SafeUrlPipe', () => {
  let pipe: SafeUrlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = TestBed.runInInjectionContext(() => new SafeUrlPipe());
  });

  it('creates an instance', () => { expect(pipe).toBeTruthy(); });

  it('transforms a url into a trusted resource url', () => {
    const result = pipe.transform('https://example.com/video.mp4');
    expect(result).toBeTruthy();
  });
});
