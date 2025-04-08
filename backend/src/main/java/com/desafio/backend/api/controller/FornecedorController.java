package com.desafio.backend.api.controller;

import com.desafio.backend.api.dto.FornecedorDTO;
import com.desafio.backend.domain.exception.BusinessException;
import com.desafio.backend.domain.model.Fornecedor;
import com.desafio.backend.domain.model.FornecedorPessoaFisica;
import com.desafio.backend.domain.model.FornecedorPessoaJuridica;
import com.desafio.backend.domain.service.FornecedorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fornecedores")
@RequiredArgsConstructor
public class FornecedorController {

    private final FornecedorService fornecedorService;
    private final ModelMapper modelMapper;

    @GetMapping
    public Page<FornecedorDTO> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String identificadorFiscal,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<Fornecedor> fornecedorPage = fornecedorService.listarTodos(nome, identificadorFiscal, pageable);
        return fornecedorPage.map(this::convertToDto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FornecedorDTO> buscar(@PathVariable Long id) {
        Fornecedor fornecedor = fornecedorService.buscarPorId(id);
        return ResponseEntity.ok(convertToDto(fornecedor));
    }

    @PostMapping
    public ResponseEntity<FornecedorDTO> adicionar(@Valid @RequestBody FornecedorDTO fornecedorDTO) {
        Fornecedor fornecedor = convertToEntity(fornecedorDTO);
        Fornecedor novoFornecedor = fornecedorService.salvar(fornecedor, fornecedorDTO.getEmpresaIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(novoFornecedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FornecedorDTO> atualizar(@PathVariable Long id, @Valid @RequestBody FornecedorDTO fornecedorDTO) {
        Fornecedor fornecedorExistente = fornecedorService.buscarPorId(id);

        if (!getTipoPessoaFromEntity(fornecedorExistente).equalsIgnoreCase(fornecedorDTO.getTipoPessoa())) {
            throw new BusinessException("Não é permitido alterar o tipo de pessoa (Física/Jurídica) do fornecedor.");
        }

        modelMapper.map(fornecedorDTO, fornecedorExistente);

        if (fornecedorExistente instanceof FornecedorPessoaFisica pf && "FISICA".equalsIgnoreCase(fornecedorDTO.getTipoPessoa())) {
            pf.setRg(fornecedorDTO.getRg());
            pf.setDataNascimento(fornecedorDTO.getDataNascimento());
        }

        Fornecedor fornecedorAtualizado = fornecedorService.salvar(fornecedorExistente, fornecedorDTO.getEmpresaIds());
        return ResponseEntity.ok(convertToDto(fornecedorAtualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        fornecedorService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private FornecedorDTO convertToDto(Fornecedor fornecedor) {
        return modelMapper.map(fornecedor, FornecedorDTO.class);
    }

    private Fornecedor convertToEntity(FornecedorDTO dto) {
        Fornecedor fornecedor;

        if ("FISICA".equalsIgnoreCase(dto.getTipoPessoa())) {
            fornecedor = modelMapper.map(dto, FornecedorPessoaFisica.class);
        } else if ("JURIDICA".equalsIgnoreCase(dto.getTipoPessoa())) {
            fornecedor = modelMapper.map(dto, FornecedorPessoaJuridica.class);
        } else {
            throw new BusinessException("Tipo de pessoa inválido: " + dto.getTipoPessoa());
        }
        fornecedor.setId(null);
        return fornecedor;
    }

    private String getTipoPessoaFromEntity(Fornecedor fornecedor) {
        if (fornecedor instanceof FornecedorPessoaFisica) return "FISICA";
        if (fornecedor instanceof FornecedorPessoaJuridica) return "JURIDICA";
        return "DESCONHECIDO";
    }
}
