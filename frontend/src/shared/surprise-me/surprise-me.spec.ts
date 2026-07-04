import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { SurpriseMe } from './surprise-me';
import { MovieService } from '../../services/movie-service';
import { AchievementsService } from '../../services/achievements-service';
import { FilmeModel } from '../../models/filme-model';

const makeFilm = (id: number, overrides: Partial<FilmeModel> = {}): FilmeModel => ({
  id, titulo: `Filme ${id}`, genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 10, sinopse: 'Sinopse', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2024-01-01'),
  total_copias: 5, diretor: 'Diretor Teste', copias_disponiveis: 3,
  ...overrides
});

describe('SurpriseMe', () => {
  let component: SurpriseMe;
  let fixture: ComponentFixture<SurpriseMe>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let achievementsSpy: jasmine.SpyObj<AchievementsService>;

  function setup(movieList: FilmeModel[]) {
    movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieSpy.getAllMovies.and.returnValue(of(movieList));
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    achievementsSpy = jasmine.createSpyObj('AchievementsService', ['unlock']);

    TestBed.configureTestingModule({
      imports: [SurpriseMe],
      providers: [
        { provide: MovieService, useValue: movieSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AchievementsService, useValue: achievementsSpy }
      ]
    });

    fixture = TestBed.createComponent(SurpriseMe);
    component = fixture.componentInstance;
  }

  describe('with movies available', () => {
    beforeEach(() => {
      jasmine.clock().install();
      setup([makeFilm(1), makeFilm(2), makeFilm(3)]);
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should unlock the lucky achievement on construction', () => {
      expect(achievementsSpy.unlock).toHaveBeenCalledWith('lucky');
    });

    it('should auto-start spinning when movies are loaded', () => {
      expect(component.spinning).toBeTrue();
      expect(component.finished).toBeFalse();
      expect(component.displayed).toBeTruthy();
    });

    it('should keep picking a random movie on every tick while spinning', () => {
      jasmine.clock().tick(70);
      expect(component.displayed).toBeTruthy();
      expect(component.spinning).toBeTrue();
    });

    it('should stop automatically after the spin duration', () => {
      jasmine.clock().tick(1800);
      expect(component.spinning).toBeFalse();
      expect(component.finished).toBeTrue();
    });

    it('rerun should restart the spin', () => {
      jasmine.clock().tick(1800);
      spyOn(component, 'start').and.callThrough();
      component.rerun();
      expect(component.start).toHaveBeenCalled();
      expect(component.spinning).toBeTrue();
    });

    it('watchNow should navigate to the displayed movie and close', () => {
      jasmine.clock().tick(1800);
      const id = component.displayed?.id;
      spyOn(component, 'close').and.callThrough();
      component.watchNow();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie', id]);
      expect(component.close).toHaveBeenCalled();
    });

    it('watchNow should do nothing when there is no displayed movie', () => {
      component.displayed = null;
      component.watchNow();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('close should stop spinning and emit closed', () => {
      let emitted = false;
      component.closed.subscribe(() => (emitted = true));
      component.close();
      expect(component.spinning).toBeFalse();
      expect(component.finished).toBeTrue();
      expect(emitted).toBeTrue();
    });

    it('onEsc should close the component', () => {
      spyOn(component, 'close');
      component.onEsc();
      expect(component.close).toHaveBeenCalled();
    });

    it('stop should clear the interval and mark as finished', () => {
      component.stop();
      expect(component.spinning).toBeFalse();
      expect(component.finished).toBeTrue();
      const displayedBeforeTick = component.displayed;
      jasmine.clock().tick(1000);
      expect(component.displayed).toBe(displayedBeforeTick);
    });

    it('ngOnDestroy should clear the running interval', () => {
      component.ngOnDestroy();
      const displayedBeforeTick = component.displayed;
      jasmine.clock().tick(1000);
      expect(component.displayed).toBe(displayedBeforeTick);
    });
  });

  describe('with no movies available', () => {
    beforeEach(() => {
      setup([]);
    });

    it('should not start spinning', () => {
      expect(component.spinning).toBeFalse();
      expect(component.displayed).toBeNull();
    });

    it('stop should do nothing when no interval was started', () => {
      spyOn(window, 'clearInterval');
      component.stop();
      expect(window.clearInterval).not.toHaveBeenCalled();
      expect(component.finished).toBeTrue();
    });

    it('ngOnDestroy should do nothing when there is no active interval', () => {
      spyOn(window, 'clearInterval');
      component.ngOnDestroy();
      expect(window.clearInterval).not.toHaveBeenCalled();
    });
  });
});
