package com.desafio.backend.domain.service;

import com.desafio.backend.domain.exception.ResourceNotFoundException;
import com.desafio.backend.domain.model.Fornecedor;
import com.desafio.backend.domain.model.FornecedorPessoaFisica;
import com.desafio.backend.domain.repository.EmpresaRepository;
import com.desafio.backend.domain.repository.FornecedorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FornecedorServiceTest {

    @Mock
    private FornecedorRepository fornecedorRepository;

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private CepService cepService;

    @InjectMocks
    private FornecedorService fornecedorService;

    private Fornecedor mockFornecedor;

    @BeforeEach
    void setUp() {
        mockFornecedor = new FornecedorPessoaFisica();
        mockFornecedor.setId(1L);
        mockFornecedor.setNome("Teste Fornecedor");
        mockFornecedor.setIdentificadorFiscal("12345678901");
        mockFornecedor.setEmail("teste@example.com");
        mockFornecedor.setCep("12345678");
    }

    @Test
    @DisplayName("buscarPorId should return Fornecedor when found")
    void buscarPorId_ShouldReturnFornecedor_WhenFound() {
        Long fornecedorId = 1L;
        when(fornecedorRepository.findById(fornecedorId)).thenReturn(Optional.of(mockFornecedor));

        Fornecedor result = fornecedorService.buscarPorId(fornecedorId);

        assertNotNull(result);
        assertEquals(fornecedorId, result.getId());
        assertEquals(mockFornecedor.getNome(), result.getNome());
        verify(fornecedorRepository, times(1)).findById(fornecedorId);
    }

    @Test
    @DisplayName("buscarPorId should throw ResourceNotFoundException when not found")
    void buscarPorId_ShouldThrowResourceNotFoundException_WhenNotFound() {
        Long fornecedorId = 99L;
        when(fornecedorRepository.findById(fornecedorId)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            fornecedorService.buscarPorId(fornecedorId);
        });

        assertEquals("Fornecedor não encontrado com ID: " + fornecedorId, exception.getMessage());
        verify(fornecedorRepository, times(1)).findById(fornecedorId);
    }
}