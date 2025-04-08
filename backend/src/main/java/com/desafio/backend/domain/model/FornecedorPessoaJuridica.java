package com.desafio.backend.domain.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("JURIDICA")
@Getter
@Setter
public class FornecedorPessoaJuridica extends Fornecedor {
}
