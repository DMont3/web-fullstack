import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CepResponse } from '../models/cep.model';

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private readonly VIA_CEP_URL = 'https://viacep.com.br/ws';
  private readonly CEP_LA_PROXY = '/api/cep';

  constructor(private http: HttpClient) { }

  consultarCep(cep: string): Observable<CepResponse | null> {
    const cepDigits = cep?.replace(/\D/g, '');

    if (cepDigits?.length !== 8) {
      return of(null);
    }

    return this.http.get<any>(`${this.VIA_CEP_URL}/${cepDigits}/json/`).pipe(
      map(data => {
        if (data.erro) {
          return null;
        }
        return {
          cep: data.cep,
          uf: data.uf,
          cidade: data.localidade,
          bairro: data.bairro,
          logradouro: data.logradouro
        };
      }),
      catchError(error => {
        console.error('Erro ao consultar ViaCEP:', error);
        return of(null);
      })
    );
  }
}
