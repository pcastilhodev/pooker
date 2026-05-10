import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Rent {
  http: HttpClient;
  constructor(http: HttpClient) { 
    this.http = http;
  }

  getRents(filmeId: number): Observable<any> {
      console.log('chegou')
      // @ts-ignore
      return this.http.post(
        '/gateway/rent/v1/alugueis/',
        { filme_id: filmeId }  
      );
    }
}
  
