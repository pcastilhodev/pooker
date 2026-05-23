import { FilterService } from './filter-service';
import { FilmeModel } from '../models/filme-model';

const makeFilm = (overrides: Partial<FilmeModel>): FilmeModel => ({
  id: 1, titulo: 'Test', genero: 'Ação', ano: new Date('2020-01-01'),
  preco_aluguel: 10, sinopse: '', imagem_url: '', duracao_minutos: 120,
  classificacao_indicativa: '12', data_lancamento: new Date('2020-01-01'),
  total_copias: 5, diretor: 'Dir', copias_disponiveis: 3, ...overrides
});

describe('FilterService', () => {
  let service: FilterService;
  const films: FilmeModel[] = [
    makeFilm({ id: 1, genero: 'Ação',  preco_aluguel: 10, duracao_minutos: 90,  ano: new Date('2020-01-01'), copias_disponiveis: 3 }),
    makeFilm({ id: 2, genero: 'Drama', preco_aluguel: 20, duracao_minutos: 150, ano: new Date('2015-01-01'), copias_disponiveis: 0 }),
  ];

  beforeEach(() => { service = new FilterService(); });

  it('empty filters return all films', () => {
    expect(service.apply(films, service.empty())).toEqual(films);
  });

  it('genre filter returns matching films', () => {
    const result = service.apply(films, { ...service.empty(), generos: ['Ação'] });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('disponivel filter excludes films with 0 copies', () => {
    const result = service.apply(films, { ...service.empty(), apenasDisponivel: true });
    expect(result.every(f => f.copias_disponiveis > 0)).toBeTrue();
  });

  it('maxPreco filter excludes expensive films', () => {
    const result = service.apply(films, { ...service.empty(), maxPreco: 15 });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('extractGenres returns sorted unique genres', () => {
    const genres = service.extractGenres(films);
    expect(genres).toEqual(['Ação', 'Drama']);
  });

  it('bounds returns correct min/max values', () => {
    const b = service.bounds(films);
    expect(b.maxPreco).toBe(20);
    expect(b.maxDuracao).toBe(150);
  });
});
