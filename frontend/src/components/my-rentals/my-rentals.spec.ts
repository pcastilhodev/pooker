import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MyRentals } from './my-rentals';
import { Rent, RentalItem } from '../../services/rent';
import { MovieService } from '../../services/movie-service';
import { AuthService } from '../../services/auth-service';
import { FilmeModel } from '../../models/filme-model';

const film = (id: number): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date(2020, 0, 1), preco_aluguel: 10,
  sinopse: '', imagem_url: 'img.jpg', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date(2020, 0, 1), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

const rental = (overrides: Partial<RentalItem> = {}): RentalItem => ({
  id: 1, filme_id: 1, data_aluguel: '2026-01-01', data_prevista_devolucao: '2026-01-05',
  status: 'ativo', valor_aluguel: 10, ...overrides,
});

describe('MyRentals', () => {
  let component: MyRentals;
  let fixture: ComponentFixture<MyRentals>;
  let rentSpy: jasmine.SpyObj<Rent>;
  let movieSpy: jasmine.SpyObj<MovieService>;
  let routerSpy: jasmine.SpyObj<Router>;

  async function setup(isLoggedIn: boolean) {
    rentSpy = jasmine.createSpyObj('Rent', ['listMyRents']);
    movieSpy = jasmine.createSpyObj('MovieService', ['getMovie']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MyRentals],
      providers: [
        { provide: Rent, useValue: rentSpy },
        { provide: MovieService, useValue: movieSpy },
        { provide: AuthService, useValue: { isLoggedIn } },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyRentals);
    component = fixture.componentInstance;
  }

  it('redirects home when not logged in', async () => {
    await setup(false);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('shows an empty list without calling movie details', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.rentals).toEqual([]);
    expect(component.loading).toBeFalse();
    expect(movieSpy.getMovie).not.toHaveBeenCalled();
  });

  it('enriches rentals with film title and image', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([rental()]));
    movieSpy.getMovie.and.returnValue(of(film(1)));
    fixture.detectChanges();

    expect(component.rentals[0].filme_titulo).toBe('F1');
    expect(component.rentals[0].filme_imagem_url).toBe('img.jpg');
    expect(component.loading).toBeFalse();
  });

  it('tolerates a failing movie lookup for one rental', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([rental()]));
    movieSpy.getMovie.and.returnValue(throwError(() => new Error('404')));
    fixture.detectChanges();

    expect(component.rentals[0].filme_titulo).toBeUndefined();
    expect(component.loading).toBeFalse();
  });

  it('sets an error message when the rentals request fails', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(throwError(() => new Error('falhou')));
    fixture.detectChanges();

    expect(component.errorMsg).toBe('Não foi possível carregar seus aluguéis.');
    expect(component.loading).toBeFalse();
  });

  it('openMovie navigates to the movie detail page', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();

    component.openMovie(7);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie', 7]);
  });

  it('goExplore navigates home', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();

    component.goExplore();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('formatDate handles missing and invalid values', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.formatDate(null)).toBe('—');
    expect(component.formatDate('not-a-date')).toBe('—');
    expect(component.formatDate('2026-01-05')).not.toBe('—');
  });

  it('statusLabel maps known statuses and falls back for unknown ones', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.statusLabel('ativo')).toBe('Em curso');
    expect(component.statusLabel('devolvido')).toBe('Devolvido');
    expect(component.statusLabel('atrasado')).toBe('Atrasado');
    expect(component.statusLabel('outro')).toBe('outro');
  });

  it('trackById returns the rental id', async () => {
    await setup(true);
    rentSpy.listMyRents.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.trackById(0, rental({ id: 9 }))).toBe(9);
  });
});
