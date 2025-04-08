package com.desafio.backend.domain.service;

import com.desafio.backend.api.dto.CepResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class CepService {

    private static final Logger log = LoggerFactory.getLogger(CepService.class);
    private final RestTemplate restTemplate;

    @Value("${cep.api.url:https://viacep.com.br/ws}")
    private String cepApiBaseUrl;

    public CepService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public Optional<CepResponseDTO> consultarCep(String cep) {
        String cleanedCep = cep != null ? cep.replaceAll("\\D", "") : "";

        if (cleanedCep.length() != 8) {
            log.warn("Formato inválido de CEP fornecido (após limpeza): '{}'", cleanedCep);
            return Optional.empty();
        }

        String apiUrl = String.format("%s/%s/json/", cepApiBaseUrl, cleanedCep);
        log.debug("Consultando ViaCEP API em: {}", apiUrl);

        try {
            ResponseEntity<CepResponseDTO> response = restTemplate.getForEntity(apiUrl, CepResponseDTO.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                CepResponseDTO body = response.getBody();
                if (body.hasError()) {
                    log.warn("CEP {} consultado com sucesso, mas API retornou erro (CEP inexistente).", cleanedCep);
                    return Optional.empty();
                } else {
                    log.info("CEP {} consultado com sucesso via ViaCEP.", cleanedCep);
                    return Optional.of(body);
                }
            } else {
                log.warn("Consulta ao ViaCEP para {} retornou status {} ou corpo vazio.", cleanedCep, response.getStatusCode());
                return Optional.empty();
            }
        } catch (HttpClientErrorException.NotFound e) {
             log.warn("ViaCEP API retornou 404 para CEP {}. URL: {}", cleanedCep, apiUrl);
             return Optional.empty();
        } catch (HttpClientErrorException.BadRequest e) {
             log.warn("ViaCEP API retornou 400 Bad Request para CEP {}. Verifique o formato. URL: {}", cleanedCep, apiUrl);
             return Optional.empty();
        } catch (RestClientException e) {
            log.error("Erro de comunicação ao consultar ViaCEP para {}: {}", cleanedCep, e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Erro inesperado ao processar consulta ViaCEP para {}: {}", cleanedCep, e.getMessage(), e);
            return Optional.empty();
        }
    }

    public boolean isParana(String cep) {
        return consultarCep(cep)
                .map(CepResponseDTO::uf)
                .map("PR"::equalsIgnoreCase)
                .orElse(false);
    }
}
