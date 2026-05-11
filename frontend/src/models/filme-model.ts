export interface CastMember {
  name: string;
  character: string;
  foto_url: string | null;
}

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
  diretor_foto_url?: string;
  elenco?: string;
  copias_disponiveis: number;
}

