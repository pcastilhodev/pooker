import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Rent } from './rent';

describe('Rent', () => {
  let service: Rent;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(Rent);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
