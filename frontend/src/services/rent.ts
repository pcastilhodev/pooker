import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface RentalItem {
  id: string | number;
  filme_id: number;
  filme_titulo?: string;
  filme_imagem_url?: string;
  data_aluguel: string;
  data_prevista_devolucao: string;
  data_devolucao?: string | null;
  status: 'ativo' | 'devolvido' | 'atrasado' | string;
  valor_aluguel: number;
}

@Injectable({
  providedIn: 'root'
})
export class Rent {
  constructor(private http: HttpClient) {}

  getRents(filmeId: number): Observable<any> {
    return this.http.post(
      '/gateway/rent/v1/alugueis/',
      { filme_id: filmeId }
    );
  }

  listMyRents(): Observable<RentalItem[]> {
    return this.http.get<RentalItem[]>('/gateway/rent/v1/alugueis/');
  }
}
