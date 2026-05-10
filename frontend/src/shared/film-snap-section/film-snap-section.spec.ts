import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmSnapSection } from './film-snap-section';
import { FilmeModel } from '../../models/filme-model';
import { Router } from '@angular/router';
import { gsap } from 'gsap';

const mockFilm: FilmeModel = {
  id: 2, titulo: 'ANORA', genero: 'Romance', ano: new Date('2024-01-01'),
  preco_aluguel: 9.90, sinopse: 'Test', imagem_url: '', duracao_minutos: 139,
  classificacao_indicativa: '18', data_lancamento: new Date('2024-01-01'),
  total_copias: 8, diretor: 'Sean Baker', copias_disponiveis: 3
};

describe('FilmSnapSection', () => {
  let component: FilmSnapSection;
  let fixture: ComponentFixture<FilmSnapSection>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    spyOn(gsap, 'context').and.returnValue({ revert: () => {} } as any);
    spyOn(gsap, 'to').and.returnValue({} as any);
    spyOn(gsap, 'fromTo').and.returnValue({} as any);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [FilmSnapSection],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(FilmSnapSection);
    component = fixture.componentInstance;
    component.film = mockFilm;
    component.index = 0;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should display film title', () => {
    const title = fixture.nativeElement.querySelector('.film-title');
    expect(title.textContent.trim()).toContain('ANORA');
  });

  it('should display director', () => {
    expect(fixture.nativeElement.querySelector('.film-director').textContent).toContain('Sean Baker');
  });

  it('should navigate to movie detail on primary button click', () => {
    fixture.nativeElement.querySelector('.film-action-primary').click();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie/2']);
  });
});
