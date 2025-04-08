export interface Empresa {
    id?: number;
    cnpj: string;
    nomeFantasia: string;
    cep: string;
    fornecedorIds?: number[];
  }