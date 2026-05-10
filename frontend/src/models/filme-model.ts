export interface FilmeModel {
  id: number;
  titulo: string;
  genero: string;
  ano: Date;
  preco_aluguel: number;
  sinopse: string;
  imagem_url: string;
  duracao_minutos: number;
  classificacao_indicativa: string;
  data_lancamento: Date;
  total_copias: number;
  diretor: string;
  copias_disponiveis: number;
}

