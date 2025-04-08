package com.desafio.backend.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "fornecedores")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_pessoa", discriminatorType = DiscriminatorType.STRING)
@Getter
@Setter
public abstract class Fornecedor extends BaseEntity {

    @NotBlank(message = "CNPJ/CPF é obrigatório")
    @Size(min = 11, max = 14, message = "CNPJ/CPF deve ter entre 11 e 14 dígitos")
    @Column(nullable = false, unique = true, length = 14, name = "identificador_fiscal")
    private String identificadorFiscal;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255)
    @Column(nullable = false)
    private String nome;

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    @Size(max = 255)
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "CEP é obrigatório")
    @Pattern(regexp = "\\d{8}", message = "CEP deve conter 8 dígitos")
    @Column(nullable = false, length = 8)
    private String cep;

    @ManyToMany(mappedBy = "fornecedores", fetch = FetchType.LAZY)
    private Set<Empresa> empresas = new HashSet<>();
}
