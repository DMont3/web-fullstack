package com.desafio.backend.domain.repository;

import com.desafio.backend.domain.model.Fornecedor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class FornecedorSpecification {

    public static Specification<Fornecedor> filterBy(String nome, String identificadorFiscal) {
        return (root, query, criteriaBuilder) -> {
            var predicates = criteriaBuilder.conjunction();

            if (StringUtils.hasText(nome)) {
                predicates = criteriaBuilder.and(predicates,
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("nome")), nome.toLowerCase() + "%"));
            }

            if (StringUtils.hasText(identificadorFiscal)) {
                predicates = criteriaBuilder.and(predicates,
                        criteriaBuilder.like(root.get("identificadorFiscal"), identificadorFiscal + "%"));
            }

            return predicates;
        };
    }
}
