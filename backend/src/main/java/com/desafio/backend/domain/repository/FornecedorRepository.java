package com.desafio.backend.domain.repository;

import com.desafio.backend.domain.model.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FornecedorRepository extends JpaRepository<Fornecedor, Long>, JpaSpecificationExecutor<Fornecedor> {
    Optional<Fornecedor> findByIdentificadorFiscal(String identificadorFiscal);
    Optional<Fornecedor> findByEmail(String email);
}