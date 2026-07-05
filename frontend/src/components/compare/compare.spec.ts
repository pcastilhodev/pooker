import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Compare } from './compare';
import { CompareService } from '../../services/compare-service';
import { MovieService } from '../../services/movie-service';
import { Rent } from '../../services/rent';
import { FilmeModel } from '../../models/filme-model';

const film = (id: number): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date(2020, 0, 1), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date(2020, 0, 1), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

describe('Compare', () => {
  let component: Compare;
  let fixture: ComponentFixture<Compare>;
  let compareSpy: jasmine.SpyObj<CompareService>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let rentSpy: jasmine.SpyObj<Rent>;
  let routerSpy: jasmine.SpyObj<Router>;

  async function setup(ids: number[]) {
    compareSpy = jasmine.createSpyObj('CompareService', ['clear'], { ids });
    movieSpy = jasmine.createSpyObj('MovieService', ['getAllMovies']);
    movieSpy.getAllMovies.and.returnValue(of([film(1), film(2), film(3)]));
    rentSpy = jasmine.createSpyObj('Rent', ['getRents']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Compare],
      providers: [
        { provide: CompareService, useValue: compareSpy },
        { provide: MovieService, useValue: movieSpy },
        { provide: Rent, useValue: rentSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Compare);
    component = fixture.componentInstance;
  }

  it('redirects home when fewer than 2 films are selected', async () => {
    await setup([1]);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('loads the selected films when 2+ ids are present', async () => {
    await setup([1, 2]);
    fixture.detectChanges();
    expect(component.films.map(f => f.id)).toEqual([1, 2]);
  });

  it('rent shows a success alert and clears loading state', async () => {
    await setup([1, 2]);
    fixture.detectChanges();
    spyOn(window, 'alert');
    rentSpy.getRents.and.returnValue(of({
      aluguel: { data_prevista_devolucao: '2026-01-05' },
      pagamento: { aluguel_id: '1', amount: 15 },
    }));

    component.rent(film(1));

    expect(window.alert).toHaveBeenCalledWith('Alugado! R$ 15');
    expect(component.rentLoading[1]).toBeFalse();
  });

  it('rent shows an error alert on failure', async () => {
    await setup([1, 2]);
    fixture.detectChanges();
    spyOn(window, 'alert');
    rentSpy.getRents.and.returnValue(throwError(() => new Error('falhou')));

    component.rent(film(1));

    expect(window.alert).toHaveBeenCalledWith('Erro ao alugar.');
  });

  it('filmYear extracts the year from a Date', async () => {
    await setup([1, 2]);
    fixture.detectChanges();
    expect(component.filmYear(film(1))).toBe(2020);
  });

  it('goBack navigates to the home page', async () => {
    await setup([1, 2]);
    fixture.detectChanges();
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
