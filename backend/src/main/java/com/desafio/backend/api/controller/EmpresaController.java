package com.desafio.backend.api.controller;

import com.desafio.backend.api.dto.EmpresaDTO;
import com.desafio.backend.domain.model.Empresa;
import com.desafio.backend.domain.service.EmpresaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/empresas")
@RequiredArgsConstructor
public class EmpresaController {

    private final EmpresaService empresaService;
    private final ModelMapper modelMapper;

    @GetMapping
    public List<EmpresaDTO> listar() {
        return empresaService.listarTodas().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpresaDTO> buscar(@PathVariable Long id) {
        Empresa empresa = empresaService.buscarPorId(id);
        return ResponseEntity.ok(convertToDto(empresa));
    }

    @PostMapping
    public ResponseEntity<EmpresaDTO> adicionar(@Valid @RequestBody EmpresaDTO empresaDTO) {
         Empresa empresa = convertToEntity(empresaDTO);
         Empresa novaEmpresa = empresaService.salvar(empresa, empresaDTO.fornecedorIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(novaEmpresa));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmpresaDTO> atualizar(@PathVariable Long id, @Valid @RequestBody EmpresaDTO empresaDTO) {
        Empresa empresaExistente = empresaService.buscarPorId(id);

        modelMapper.map(empresaDTO, empresaExistente);
        empresaExistente.setId(id);

        Empresa empresaAtualizada = empresaService.salvar(empresaExistente, empresaDTO.fornecedorIds());
        return ResponseEntity.ok(convertToDto(empresaAtualizada));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        empresaService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private EmpresaDTO convertToDto(Empresa empresa) {
        return modelMapper.map(empresa, EmpresaDTO.class);
    }

    private Empresa convertToEntity(EmpresaDTO empresaDTO) {
        Empresa empresa = modelMapper.map(empresaDTO, Empresa.class);
        return empresa;
    }
}
