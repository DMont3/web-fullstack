package com.desafio.backend.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@DiscriminatorValue("FISICA")
@Getter
@Setter
public class FornecedorPessoaFisica extends Fornecedor {

    @NotBlank(message = "RG é obrigatório")
    @Size(max = 20)
    @Column(length = 20)
    private String rg;

    @NotNull(message = "Data de Nascimento é obrigatória")
    @Past(message = "Data de Nascimento deve ser no passado")
    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    public Integer getAge() {
        if (dataNascimento == null) {
            return null;
        }
        return java.time.Period.between(dataNascimento, LocalDate.now()).getYears();
    }
}
