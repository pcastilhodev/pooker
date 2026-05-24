import { RecommendationService } from './recommendation-service';
import { FilmeModel } from '../models/filme-model';

const f = (id: number, genero: string): FilmeModel => ({
  id, titulo: `F${id}`, genero, ano: new Date('2020-01-01'), preco_aluguel: 10,
  sinopse: '', imagem_url: '', duracao_minutos: 90, classificacao_indicativa: '12',
  data_lancamento: new Date('2020-01-01'), total_copias: 5, diretor: 'D', copias_disponiveis: 3
});

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(() => { localStorage.clear(); service = new RecommendationService(); });

  it('returns empty array when no recent history', () => {
    expect(service.recommend([f(1, 'Ação')], [])).toEqual([]);
  });

  it('recommends films matching genres of recently viewed', () => {
    const recent = [f(1, 'Ação')];
    const all = [f(1, 'Ação'), f(2, 'Ação'), f(3, 'Drama')];
    const result = service.recommend(all, recent);
    expect(result.find(m => m.id === 2)).toBeTruthy();
    expect(result.find(m => m.id === 1)).toBeFalsy(); // exclude source
  });

  it('excludes source films from recommendations', () => {
    const recent = [f(1, 'Ação')];
    const all = [f(1, 'Ação')];
    expect(service.recommend(all, recent)).toEqual([]);
  });

  it('trackView stores film id in localStorage', () => {
    service.trackView(42);
    expect(service.recentIds()).toContain(42);
  });

  it('trackView deduplicates and keeps most recent first', () => {
    service.trackView(1);
    service.trackView(2);
    service.trackView(1);
    const ids = service.recentIds();
    expect(ids[0]).toBe(1);
    expect(ids.filter(id => id === 1).length).toBe(1);
  });
});
