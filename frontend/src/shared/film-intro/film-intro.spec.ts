import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmIntro } from './film-intro';

describe('FilmIntro', () => {
  let component: FilmIntro;
  let fixture: ComponentFixture<FilmIntro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilmIntro] }).compileComponents();
    fixture = TestBed.createComponent(FilmIntro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should emit dismissed when dismiss() is called', () => {
    let emitted = false;
    component.dismissed.subscribe(() => emitted = true);
    component.dismiss();
    expect(emitted).toBeTrue();
  });

  it('should emit dismissed when overlay is clicked', () => {
    let emitted = false;
    component.dismissed.subscribe(() => emitted = true);
    fixture.nativeElement.querySelector('#intro').click();
    expect(emitted).toBeTrue();
  });
});
