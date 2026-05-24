import { TrendingService } from './trending-service';
import { FilmeModel } from '../models/filme-model';

const f = (id: number, total: number, disp: number, preco = 10, dur = 90): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date('2020-01-01'), preco_aluguel: preco,
  sinopse: '', imagem_url: '', duracao_minutos: dur, classificacao_indicativa: '12',
  data_lancamento: new Date('2020-01-01'), total_copias: total, diretor: 'D', copias_disponiveis: disp
});

describe('TrendingService', () => {
  let service: TrendingService;

  beforeEach(() => { service = new TrendingService(); });

  it('ranks by rental rate descending', () => {
    const films = [f(1, 10, 8), f(2, 10, 2), f(3, 10, 5)];
    const result = service.topByRentalRate(films, 3);
    expect(result[0].id).toBe(2); // 80% rented
    expect(result[1].id).toBe(3); // 50% rented
  });

  it('topByPrice returns most expensive first', () => {
    const films = [f(1, 5, 3, 15), f(2, 5, 3, 25), f(3, 5, 3, 10)];
    const result = service.topByPrice(films, 3);
    expect(result[0].id).toBe(2);
  });

  it('respects limit', () => {
    const films = [f(1,10,5), f(2,10,3), f(3,10,1), f(4,10,8)];
    expect(service.topByRentalRate(films, 2).length).toBe(2);
  });

  it('topByDuration returns longest first', () => {
    const films = [f(1,5,3,10,90), f(2,5,3,10,180), f(3,5,3,10,120)];
    expect(service.topByDuration(films, 3)[0].id).toBe(2);
  });

  it('excludes films with total_copias 0 from rental rate ranking', () => {
    const films = [f(1, 0, 0), f(2, 10, 2)];
    const result = service.topByRentalRate(films, 5);
    expect(result.find(m => m.id === 1)).toBeFalsy();
  });
});
