import { FilmeModel } from './filme-model';

describe('FilmeModel', () => {
  it('should be a valid interface shape', () => {
    const model: FilmeModel = {
      id: 1,
      titulo: 'Test',
      genero: 'Drama',
      ano: new Date('2024'),
      preco_aluguel: 9.9,
      sinopse: 'Sinopse',
      imagem_url: 'img.jpg',
      duracao_minutos: 120,
      classificacao_indicativa: '14',
      data_lancamento: new Date('2024-01-01'),
      total_copias: 5,
      diretor: 'Diretor',
      copias_disponiveis: 3,
    };
    expect(model.id).toBe(1);
  });
});
