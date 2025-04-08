package com.desafio.backend.domain.service;

import com.desafio.backend.domain.exception.BusinessException;
import com.desafio.backend.domain.exception.ResourceNotFoundException;
import com.desafio.backend.domain.model.Empresa;
import com.desafio.backend.domain.model.Fornecedor;
import com.desafio.backend.domain.repository.EmpresaRepository;
import com.desafio.backend.domain.repository.FornecedorRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmpresaService {

    private final EmpresaRepository empresaRepository;
    private final FornecedorRepository fornecedorRepository;
    private final CepService cepService;

    public List<Empresa> listarTodas() {
        return empresaRepository.findAll();
    }

    public Empresa buscarPorId(Long id) {
        return empresaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada com ID: " + id));
    }

    @Transactional
    public Empresa salvar(Empresa empresa, Set<Long> fornecedorIds) {
        cepService.consultarCep(empresa.getCep())
                .orElseThrow(() -> new BusinessException("CEP inválido ou não encontrado: " + empresa.getCep()));

        empresaRepository.findByCnpj(empresa.getCnpj())
                .filter(existing -> !existing.getId().equals(empresa.getId()))
                .ifPresent(existing -> {
                    throw new BusinessException("CNPJ já cadastrado: " + empresa.getCnpj());
                });

        Set<Fornecedor> resolvedFornecedores = resolveFornecedores(fornecedorIds);
        empresa.setFornecedores(resolvedFornecedores);

        Empresa savedEmpresa = empresaRepository.save(empresa);

        updateFornecedorEmpresas(savedEmpresa, resolvedFornecedores);

        return savedEmpresa;
    }

    @Transactional
    public void deletar(Long id) {
        Empresa empresa = buscarPorId(id);

        empresa.getFornecedores().forEach(f -> f.getEmpresas().remove(empresa));

        empresaRepository.delete(empresa);
    }

    private Set<Fornecedor> resolveFornecedores(Set<Long> fornecedorIds) {
        if (fornecedorIds == null || fornecedorIds.isEmpty()) {
            return new HashSet<>();
        }
        Set<Fornecedor> fornecedores = new HashSet<>(fornecedorRepository.findAllById(fornecedorIds));
        if (fornecedores.size() != fornecedorIds.size()) {
            Set<Long> foundIds = fornecedores.stream().map(Fornecedor::getId).collect(Collectors.toSet());
            fornecedorIds.removeAll(foundIds);
            throw new ResourceNotFoundException("Um ou mais fornecedores não encontrados com IDs: " + fornecedorIds);
        }
        return fornecedores;
    }

    private void updateFornecedorEmpresas(Empresa empresa, Set<Fornecedor> currentFornecedores) {
        List<Fornecedor> oldSuppliers = fornecedorRepository.findAllById(
            empresaRepository.findById(empresa.getId())
                             .map(e -> e.getFornecedores().stream().map(Fornecedor::getId).collect(Collectors.toSet()))
                             .orElse(new HashSet<>())
        );

        oldSuppliers.stream()
            .filter(f -> !currentFornecedores.contains(f))
            .forEach(f -> f.getEmpresas().remove(empresa));

        currentFornecedores.forEach(f -> f.getEmpresas().add(empresa));
    }
}
