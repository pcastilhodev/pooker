import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RecommendationsSection } from './recommendations-section';
import { FilmeModel } from '../../models/filme-model';

const mockFilm: FilmeModel = {
  id: 1, titulo: 'The Brutalist', genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 12.90, sinopse: 'Test', imagem_url: '', duracao_minutos: 215,
  classificacao_indicativa: '16', data_lancamento: new Date('2024-01-01'),
  total_copias: 10, diretor: 'Brady Corbet', copias_disponiveis: 5
};

describe('RecommendationsSection', () => {
  let component: RecommendationsSection;
  let fixture: ComponentFixture<RecommendationsSection>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RecommendationsSection],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsSection);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('go', () => {
    it('should navigate to /movie/:id', () => {
      component.go(42);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie', 42]);
    });
  });

  describe('template interactions', () => {
    it('should not render the section when films is empty', () => {
      component.films = [];
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.rec-wrap')).toBeNull();
    });

    it('should render a card per film when films is set', () => {
      component.films = [mockFilm, { ...mockFilm, id: 2, titulo: 'Second' }];
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('.rec-card');
      expect(cards.length).toBe(2);
    });

    it('should call go(film.id) when a card is clicked', () => {
      spyOn(component, 'go');
      component.films = [mockFilm];
      fixture.detectChanges();
      const card: HTMLButtonElement = fixture.nativeElement.querySelector('.rec-card');
      card.click();
      expect(component.go).toHaveBeenCalledWith(mockFilm.id);
    });

    it('should not render an img when imagem_url is empty', () => {
      component.films = [{ ...mockFilm, imagem_url: '' }];
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.rec-poster img')).toBeNull();
    });

    it('should render an img when imagem_url is set', () => {
      component.films = [{ ...mockFilm, imagem_url: 'https://example.com/poster.jpg' }];
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.rec-poster img')).not.toBeNull();
    });
  });
});
