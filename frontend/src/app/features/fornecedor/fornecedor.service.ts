import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Fornecedor, Page } from '../../models/fornecedor.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  private apiUrl = `${environment.apiUrl}/fornecedores`;

  constructor(private http: HttpClient) { }

  getFornecedores(page: number, size: number, nome?: string, identificadorFiscal?: string): Observable<Page<Fornecedor>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (nome && nome.trim() !== '') {
        params = params.set('nome', nome.trim());
    }
    if (identificadorFiscal && identificadorFiscal.trim() !== '') {
        params = params.set('identificadorFiscal', identificadorFiscal.trim());
    }

    console.log(`[FornecedorService] Fetching page ${page}, size ${size} with params: ${params.toString()}`);

    return this.http.get<Page<Fornecedor>>(this.apiUrl, { params }).pipe(
        tap(data => {
            if (data && typeof data === 'object' && Array.isArray(data.content)) {
                console.log(`[FornecedorService] Received data for page ${page}:`, data);
                console.log(`[FornecedorService] Content length: ${data.content.length}, Total elements: ${data.totalElements}`);
            } else {
                console.warn('[FornecedorService] Received unexpected data structure:', data);
            }
        }),
        catchError(err => {
          console.error(`[FornecedorService] Error fetching page ${page}:`, err);
          const emptyPage: Page<Fornecedor> = { content: [], totalElements: 0, totalPages: 0, size: size, number: page };
          return of(emptyPage);
        })
    );
  }

  getAllFornecedoresSimple(): Observable<Fornecedor[]> {
     const params = new HttpParams().set('size', '1000');
     console.log('[FornecedorService] Fetching simple list with params:', params.toString());
     return this.http.get<Page<Fornecedor>>(this.apiUrl, { params })
                .pipe(
                    tap(page => console.log('[FornecedorService] Received simple list page:', page)),
                    map(page => (page && Array.isArray(page.content)) ? page.content : []),
                    catchError(err => {
                        console.error('[FornecedorService] Error fetching simple list:', err);
                        return of([]);
                    })
                );
   }

   getFornecedor(id: number): Observable<Fornecedor> {
     console.log(`[FornecedorService] Fetching fornecedor with ID: ${id}`);
     return this.http.get<Fornecedor>(`${this.apiUrl}/${id}`).pipe(
         tap(data => console.log(`[FornecedorService] Received fornecedor ${id}:`, data)),
         catchError(err => {
             console.error(`[FornecedorService] Error fetching fornecedor ${id}:`, err);
             return throwError(() => err);
         })
     );
   }

   createFornecedor(fornecedor: Fornecedor): Observable<Fornecedor> {
     console.log('[FornecedorService] Creating fornecedor:', fornecedor);
     if (fornecedor.dataNascimento instanceof Date) {
        fornecedor.dataNascimento = fornecedor.dataNascimento.toISOString().split('T')[0];
     }
     return this.http.post<Fornecedor>(this.apiUrl, fornecedor).pipe(
         tap(data => console.log('[FornecedorService] Created fornecedor response:', data)),
         catchError(err => {
             console.error('[FornecedorService] Error creating fornecedor:', err);
             return throwError(() => err);
         })
     );
   }

   updateFornecedor(id: number, fornecedor: Fornecedor): Observable<Fornecedor> {
     console.log(`[FornecedorService] Updating fornecedor ${id}:`, fornecedor);
     if (fornecedor.dataNascimento instanceof Date) {
        fornecedor.dataNascimento = fornecedor.dataNascimento.toISOString().split('T')[0];
     }
     return this.http.put<Fornecedor>(`${this.apiUrl}/${id}`, fornecedor).pipe(
         tap(data => console.log(`[FornecedorService] Updated fornecedor ${id} response:`, data)),
         catchError(err => {
             console.error(`[FornecedorService] Error updating fornecedor ${id}:`, err);
             return throwError(() => err);
         })
     );
   }

   deleteFornecedor(id: number): Observable<void> {
     console.log(`[FornecedorService] Deleting fornecedor with ID: ${id}`);
     return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
         tap(() => console.log(`[FornecedorService] Deleted fornecedor ${id}`)),
         catchError(err => {
             console.error(`[FornecedorService] Error deleting fornecedor ${id}:`, err);
             return throwError(() => err);
         })
     );
   }
}
