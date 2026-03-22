# Vacancies Service - Fluxos e Escopo

Documento pragmatico para definir o que o servico de vagas faz, como faz, e o impacto nos outros servicos.

## Fluxos (o que faz e como faz)

### 1) Criar vaga

Entrada:

- Comando/API do Gateway (ex: POST /vacancies)

Passos:

- Validar dados basicos (titulo, descricao, status)
- Persistir Vacancy
- Persistir criterios iniciais (peso por criterio)
- Publicar `vacancies.event.created`

### 2) Atualizar vaga

Entrada:

- Comando/API do Gateway (ex: PATCH /vacancies/{id})

Passos:

- Validar e atualizar campos editaveis
- Persistir mudancas
- Publicar `vacancies.event.updated`

### 3) Atualizar criterios da vaga

Entrada:

- Comando/API do Gateway (ex: PUT /vacancies/{id}/criteria)

Passos:

- Validar criterios (chaves conhecidas, pesos 0-100)
- Persistir criterios e versao do conjunto
- Publicar `vacancies.event.criteria_updated` com vacancyId + versao

### 4) Vincular candidato a vaga

Entrada:

- Comando/API do Gateway (ex: POST /vacancies/{id}/candidates)

Passos:

- Criar CandidateVacancy (vacancyId + candidateId + status)
- Publicar `vacancies.event.candidate_linked`

### 5) Reprocessar analises quando criterios mudam

Entrada:

- Evento `vacancies.event.criteria_updated`

Passos:

- Obter lista de CandidateVacancy para a vaga
- Disparar reprocessamento no PsychAnalysis (evento/command dedicado)
- Manter idempotencia por (vacancyId, criteriaVersion, candidateId)

## O que o servico vai ter (escopo interno)

### Entidades

- Vacancy: id, title, description, status, createdAt, updatedAt
- VacancyCriteria: vacancyId, version, criteria (key/peso), updatedAt
- CandidateVacancy: vacancyId, candidateId, status, createdAt

### Use cases

- CreateVacancy
- UpdateVacancy
- UpdateVacancyCriteria
- LinkCandidateToVacancy
- ListVacancyCandidates (para reprocessamento)

### Repositorios

- VacanciesRepository
- VacancyCriteriaRepository
- CandidateVacanciesRepository

### Eventos (contracts)

- vacancies.event.created
- vacancies.event.updated
- vacancies.event.criteria_updated
- vacancies.event.candidate_linked

### Infra

- Handler HTTP (Gateway) ou Kafka command handler
- TypeORM + Postgres
- Kafka publisher
- Migrations
- Testes unit e integracao

## Mudancas necessarias em outros servicos

### shared/contracts

- Adicionar eventos e topics de Vacancy e CandidateVacancy
- Adicionar payload de criteria_updated (vacancyId + criteriaVersion + criteria)

### candidates

- Suportar vacancyId opcional no fluxo de criacao de profile
- Incluir vacancyId no `CandidateProfile.Created` quando existir
- (Futuro) consumir `vacancies.event.candidate_linked` se quiser criar profile sob demanda

### psych-analysis

- Consumir `vacancies.event.criteria_updated`
- Reprocessar candidatos vinculados a vaga
- Incluir criteriaVersion na analise para rastreio

### gateway

- Endpoints CRUD de vaga
- Endpoint para atualizar criterios
- Endpoint para vincular candidato a vaga

### resumes

- Sem mudancas diretas

---

Observacao: o fluxo e projetado para ser simples e idempotente, com foco em MVP e reprocessamento controlado por eventos.
