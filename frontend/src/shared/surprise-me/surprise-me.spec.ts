import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SurpriseMe } from './surprise-me';
import { MovieService } from '../../services/movie-service';
import { AchievementsService } from '../../services/achievements-service';
import { FilmeModel } from '../../models/filme-model';

const f = (id: number): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date('2020-01-01'), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date('2020-01-01'), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

describe('SurpriseMe', () => {
  let component: SurpriseMe;
  let moviesSpy: jasmine.SpyObj<MovieService>;
  let achievementsSpy: jasmine.SpyObj<AchievementsService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let timeoutFns: Array<() => void>;

  beforeEach(() => {
    timeoutFns = [];
    spyOn(window, 'setTimeout').and.callFake((fn: any) => { timeoutFns.push(fn); return 0 as any; });
    spyOn(window, 'setInterval').and.returnValue(123 as any);

    moviesSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    moviesSpy.getAllMovies.and.returnValue(of([f(1), f(2), f(3)]));
    achievementsSpy = jasmine.createSpyObj('AchievementsService', ['unlock']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MovieService, useValue: moviesSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AchievementsService, useValue: achievementsSpy },
      ],
    });
    component = TestBed.runInInjectionContext(() => new SurpriseMe());
  });

  it('should create and unlock the lucky achievement', () => {
    expect(component).toBeTruthy();
    expect(achievementsSpy.unlock).toHaveBeenCalledWith('lucky');
  });

  it('starts spinning automatically once movies load', () => {
    expect(component.spinning).toBeTrue();
    expect(component.pool.length).toBe(3);
  });

  it('stops spinning once the scheduled stop callback fires', () => {
    timeoutFns[timeoutFns.length - 1]();
    expect(component.spinning).toBeFalse();
    expect(component.finished).toBeTrue();
  });

  it('rerun starts a new spin', () => {
    timeoutFns[timeoutFns.length - 1]();
    component.rerun();
    expect(component.spinning).toBeTrue();
  });

  it('watchNow navigates to the displayed movie and closes', () => {
    let closed = false;
    component.closed.subscribe(() => (closed = true));

    component.watchNow();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie', component.displayed!.id]);
    expect(closed).toBeTrue();
  });

  it('close stops the spin and emits closed', () => {
    let closed = false;
    component.closed.subscribe(() => (closed = true));
    component.close();

    expect(component.spinning).toBeFalse();
    expect(closed).toBeTrue();
  });

  it('onBackdrop closes only when the backdrop itself was clicked', () => {
    let closed = false;
    component.closed.subscribe(() => (closed = true));
    const el = {} as EventTarget;
    component.onBackdrop({ target: el, currentTarget: el } as unknown as Event);
    expect(closed).toBeTrue();
  });

  it('ngOnDestroy clears the running interval', () => {
    spyOn(window, 'clearInterval');
    component.ngOnDestroy();
    expect(window.clearInterval).toHaveBeenCalledWith(123 as any);
  });
});
