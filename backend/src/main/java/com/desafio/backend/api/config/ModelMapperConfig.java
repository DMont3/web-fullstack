package com.desafio.backend.api.config;

import com.desafio.backend.api.dto.EmpresaDTO;
import com.desafio.backend.api.dto.FornecedorDTO;
import com.desafio.backend.domain.model.*;
import org.modelmapper.ModelMapper;
import org.modelmapper.Provider;
import org.modelmapper.convention.MatchingStrategies;
import org.modelmapper.spi.ErrorMessage;
import org.modelmapper.Converter;
import org.modelmapper.spi.MappingContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE);

        Converter<Empresa, EmpresaDTO> empresaToDtoConverter = context -> {
            Empresa source = context.getSource();
            if (source == null) return null;
            Set<Long> fornecedorIds = source.getFornecedores() == null ? Collections.emptySet() :
                    source.getFornecedores().stream().map(BaseEntity::getId).collect(Collectors.toSet());
            return new EmpresaDTO(source.getId(), source.getCnpj(), source.getNomeFantasia(), source.getCep(), fornecedorIds);
        };
        modelMapper.createTypeMap(Empresa.class, EmpresaDTO.class)
                   .setConverter(empresaToDtoConverter);

        Converter<EmpresaDTO, Empresa> dtoToEmpresaConverter = context -> {
            EmpresaDTO source = context.getSource();
            if (source == null) return null;
            Empresa destination = new Empresa();
            destination.setCnpj(source.cnpj());
            destination.setNomeFantasia(source.nomeFantasia());
            destination.setCep(source.cep());
            return destination;
        };
        modelMapper.createTypeMap(EmpresaDTO.class, Empresa.class)
                   .setConverter(dtoToEmpresaConverter);

        Converter<Set<Empresa>, Set<Long>> empresasToIdsConverter = ctx ->
            ctx.getSource() == null ? Collections.emptySet() :
            ctx.getSource().stream().map(BaseEntity::getId).collect(Collectors.toSet());

        modelMapper.createTypeMap(FornecedorPessoaFisica.class, FornecedorDTO.class)
            .addMappings(mapper -> {
                mapper.map(FornecedorPessoaFisica::getRg, FornecedorDTO::setRg);
                mapper.map(FornecedorPessoaFisica::getDataNascimento, FornecedorDTO::setDataNascimento);
                mapper.using(empresasToIdsConverter).map(Fornecedor::getEmpresas, FornecedorDTO::setEmpresaIds);
                mapper.map(src -> "FISICA", FornecedorDTO::setTipoPessoa);
            });

        modelMapper.createTypeMap(FornecedorPessoaJuridica.class, FornecedorDTO.class)
            .addMappings(mapper -> {
                 mapper.skip(FornecedorDTO::setRg);
                 mapper.skip(FornecedorDTO::setDataNascimento);
                 mapper.using(empresasToIdsConverter).map(Fornecedor::getEmpresas, FornecedorDTO::setEmpresaIds);
                 mapper.map(src -> "JURIDICA", FornecedorDTO::setTipoPessoa);
            });

        Provider<FornecedorPessoaFisica> pfProvider = req -> new FornecedorPessoaFisica();
        modelMapper.createTypeMap(FornecedorDTO.class, FornecedorPessoaFisica.class)
             .setProvider(pfProvider)
             .addMappings(mapper -> {
                 mapper.skip(FornecedorPessoaFisica::setId);
                 mapper.skip(FornecedorPessoaFisica::setEmpresas);
                 mapper.map(FornecedorDTO::getRg, FornecedorPessoaFisica::setRg);
                 mapper.map(FornecedorDTO::getDataNascimento, FornecedorPessoaFisica::setDataNascimento);
             });

        Provider<FornecedorPessoaJuridica> pjProvider = req -> new FornecedorPessoaJuridica();
        modelMapper.createTypeMap(FornecedorDTO.class, FornecedorPessoaJuridica.class)
             .setProvider(pjProvider)
             .addMappings(mapper -> {
                 mapper.skip(FornecedorPessoaJuridica::setId);
                 mapper.skip(FornecedorPessoaJuridica::setEmpresas);
             });

         try {
             modelMapper.validate();
             System.out.println("ModelMapper configuration is valid.");
         } catch (org.modelmapper.ValidationException e) {
             System.err.println("ModelMapper configuration errors detected:");
             for (ErrorMessage errorMessage : e.getErrorMessages()) {
                 System.err.println("  - " + errorMessage.getMessage());
             }
         }

        return modelMapper;
    }
}
