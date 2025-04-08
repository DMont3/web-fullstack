package com.desafio.backend.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FornecedorDTO {

    private Long id;

    @NotBlank(message = "Tipo (FISICA/JURIDICA) é obrigatório")
    private String tipoPessoa;

    @NotBlank(message = "CNPJ/CPF é obrigatório")
    @Size(min = 11, max = 14)
    private String identificadorFiscal;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255)
    private String nome;

    @NotBlank(message = "E-mail é obrigatório")
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank(message = "CEP é obrigatório")
    @Pattern(regexp = "\\d{8}", message = "CEP deve conter 8 dígitos")
    private String cep;

    private String rg;
    private LocalDate dataNascimento;

    private Set<Long> empresaIds;
}
