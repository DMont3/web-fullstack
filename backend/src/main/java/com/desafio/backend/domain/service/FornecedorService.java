package com.desafio.backend.domain.service;

import com.desafio.backend.domain.exception.BusinessException;
import com.desafio.backend.domain.exception.ResourceNotFoundException;
import com.desafio.backend.domain.model.*;
import com.desafio.backend.domain.repository.EmpresaRepository;
import com.desafio.backend.domain.repository.FornecedorRepository;
import com.desafio.backend.domain.repository.FornecedorSpecification;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FornecedorService {

    private final FornecedorRepository fornecedorRepository;
    private final EmpresaRepository empresaRepository;
    private final CepService cepService;

    public Page<Fornecedor> listarTodos(String nomeFilter, String identificadorFilter, Pageable pageable) {
        Specification<Fornecedor> spec = FornecedorSpecification.filterBy(nomeFilter, identificadorFilter);
        return fornecedorRepository.findAll(spec, pageable);
    }

    public Fornecedor buscarPorId(Long id) {
        return fornecedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado com ID: " + id));
    }

    @Transactional
    public Fornecedor salvar(Fornecedor fornecedor, Set<Long> empresaIds) {
        cepService.consultarCep(fornecedor.getCep())
                .orElseThrow(() -> new BusinessException("CEP inválido ou não encontrado: " + fornecedor.getCep()));

        validateUniqueness(fornecedor);

        Set<Empresa> resolvedEmpresas = resolveEmpresas(empresaIds);

        if (fornecedor instanceof FornecedorPessoaFisica pf) {
            validateParanaAgeRule(pf, resolvedEmpresas);
        }

        fornecedor.setEmpresas(resolvedEmpresas);

        Fornecedor savedFornecedor = fornecedorRepository.save(fornecedor);

        updateEmpresaFornecedores(savedFornecedor, resolvedEmpresas);

        return savedFornecedor;
    }

    @Transactional
    public void deletar(Long id) {
        Fornecedor fornecedor = buscarPorId(id);

        new HashSet<>(fornecedor.getEmpresas()).forEach(empresa -> {
            empresa.getFornecedores().remove(fornecedor);
        });
        fornecedor.getEmpresas().clear();

        fornecedorRepository.delete(fornecedor);
    }

    private void validateUniqueness(Fornecedor fornecedor) {
        fornecedorRepository.findByIdentificadorFiscal(fornecedor.getIdentificadorFiscal())
                .filter(existing -> !existing.getId().equals(fornecedor.getId()))
                .ifPresent(e -> { throw new BusinessException("Identificador Fiscal (CNPJ/CPF) já cadastrado."); });

        fornecedorRepository.findByEmail(fornecedor.getEmail())
                .filter(existing -> !existing.getId().equals(fornecedor.getId()))
                .ifPresent(e -> { throw new BusinessException("E-mail já cadastrado."); });
    }

    private Set<Empresa> resolveEmpresas(Set<Long> empresaIds) {
        if (empresaIds == null || empresaIds.isEmpty()) {
            return new HashSet<>();
        }
        Set<Empresa> empresas = new HashSet<>(empresaRepository.findAllById(empresaIds));
        if (empresas.size() != empresaIds.size()) {
            Set<Long> foundIds = empresas.stream().map(Empresa::getId).collect(Collectors.toSet());
            empresaIds.removeAll(foundIds);
            throw new ResourceNotFoundException("Uma ou mais empresas não encontradas com IDs: " + empresaIds);
        }
        return empresas;
    }

    private void updateEmpresaFornecedores(Fornecedor fornecedor, Set<Empresa> currentEmpresas) {
        List<Empresa> oldCompanies = empresaRepository.findAllById(
            fornecedorRepository.findById(fornecedor.getId())
                               .map(f -> f.getEmpresas().stream().map(Empresa::getId).collect(Collectors.toSet()))
                               .orElse(new HashSet<>())
        );

        oldCompanies.stream()
            .filter(e -> !currentEmpresas.contains(e))
            .forEach(e -> e.getFornecedores().remove(fornecedor));

        currentEmpresas.forEach(e -> e.getFornecedores().add(fornecedor));
    }

    private void validateParanaAgeRule(FornecedorPessoaFisica fornecedorPF, Set<Empresa> empresas) {
        Integer age = fornecedorPF.getAge();
        if (age == null || age < 18) {
            boolean associatedWithParana = empresas.stream()
                    .anyMatch(empresa -> cepService.isParana(empresa.getCep()));

            if (associatedWithParana) {
                throw new BusinessException("Empresas do Paraná não podem cadastrar fornecedores pessoa física menores de idade.");
            }
        }
    }
}
