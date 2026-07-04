import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface RentResponse {
  aluguel: { data_prevista_devolucao: string };
  pagamento: { aluguel_id: string; amount: number };
}

export interface RentalItem {
  id: string | number;
  filme_id: number;
  filme_titulo?: string;
  filme_imagem_url?: string;
  data_aluguel: string;
  data_prevista_devolucao: string;
  data_devolucao?: string | null;
  status: string;
  valor_aluguel: number;
}

@Injectable({
  providedIn: 'root'
})
export class Rent {
  private readonly http = inject(HttpClient);


  getRents(filmeId: number): Observable<RentResponse> {
    return this.http.post<RentResponse>(
      '/gateway/rent/v1/alugueis/',
      { filme_id: filmeId }
    );
  }

  listMyRents(): Observable<RentalItem[]> {
    return this.http.get<RentalItem[]>('/gateway/rent/v1/alugueis/');
  }
}
