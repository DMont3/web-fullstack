import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CepService } from './cep.service';
import { CepResponse } from '../models/cep.model';

describe('CepService', () => {
  let service: CepService;
  let httpMock: HttpTestingController;
  const viaCepUrlBase = 'https://viacep.com.br/ws';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CepService]
    });
    service = TestBed.inject(CepService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return CepResponse when consultarCep is called with a valid CEP', () => {
    const mockCep = '12345678';
    const mockResponse: CepResponse = {
      cep: '12345-678',
      uf: 'SP',
      cidade: 'São Paulo',
      bairro: 'Vila Teste',
      logradouro: 'Rua Teste'
    };
    const apiResponse = {
      cep: '12345-678',
      logradouro: 'Rua Teste',
      complemento: '',
      bairro: 'Vila Teste',
      localidade: 'São Paulo',
      uf: 'SP',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107'
    };

    service.consultarCep(mockCep).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${viaCepUrlBase}/${mockCep}/json/`);
    expect(req.request.method).toBe('GET');

    req.flush(apiResponse);
  });

  it('should return null when consultarCep is called with an invalid CEP format', () => {
    const invalidCep = '12345';

    service.consultarCep(invalidCep).subscribe(response => {
      expect(response).toBeNull();
    });

    httpMock.expectNone(`${viaCepUrlBase}/${invalidCep}/json/`);
  });

  it('should return null when ViaCEP API returns an error (e.g., CEP not found)', () => {
    const mockCep = '99999999';
    const apiErrorResponse = { erro: true };

    service.consultarCep(mockCep).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${viaCepUrlBase}/${mockCep}/json/`);
    expect(req.request.method).toBe('GET');
    req.flush(apiErrorResponse);
  });

  it('should return null when HTTP request fails', () => {
    const mockCep = '12345678';

    service.consultarCep(mockCep).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${viaCepUrlBase}/${mockCep}/json/`);
    expect(req.request.method).toBe('GET');
    req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
  });
});
