export interface Fornecedor {
    id?: number;
    tipoPessoa: 'FISICA' | 'JURIDICA';
    identificadorFiscal: string;
    nome: string;
    email: string;
    cep: string;
    rg?: string;
    dataNascimento?: string | Date;
    empresaIds?: number[];
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}
