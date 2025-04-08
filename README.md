# Desafio Fullstack

Este projeto é uma aplicação full-stack construída com as seguintes tecnologias:

## Backend

*   **Linguagem:** Java
*   **Framework:** Spring Boot
*   **Ferramenta de Build:** Maven
*   **Banco de Dados:** PostgreSQL
*   **Descrição:** O backend fornece APIs REST para gerenciar dados. Ele usa Spring Data JPA para interação com o banco de dados e inclui tratamento de exceções para problemas comuns relacionados a negócios e recursos.

## Frontend

*   **Framework:** Angular
*   **Ferramenta de Build:** Angular CLI
*   **Descrição:** O frontend é uma aplicação de página única construída com Angular. Ele consome as APIs do backend para exibir e gerenciar dados.

## Containerização

*   **Tecnologia:** Docker
*   **Descrição:** Tanto o frontend quanto o backend podem ser containerizados usando Docker. Dockerfiles são fornecidos para cada um.

## Peculiaridades e Fatos Relevantes

*   O backend usa uma arquitetura em camadas com controllers, services e repositories.
*   O frontend usa componentes e serviços Angular para gerenciar a interface do usuário e os dados.
*   O CORS é configurado no backend para permitir solicitações do frontend.
*   O projeto inclui tratamento de exceções para problemas comuns relacionados a negócios e recursos.
```
