# Sistema de Gestão de Manutenção

Aplicação web desenvolvida para gerenciamento de chamados e atividades de manutenção, com controle de usuários, abertura e acompanhamento de chamados, indicadores operacionais e geração de relatórios.

## 📋 Sobre o projeto

O Sistema de Gestão de Manutenção foi desenvolvido como projeto prático de portfólio com o objetivo de aplicar conceitos de desenvolvimento de sistemas, integração entre frontend e backend, API REST, banco de dados e análise de indicadores de manutenção.

A aplicação foi pensada para representar um cenário de gestão de manutenção industrial, permitindo registrar chamados, acompanhar seu status, atribuir técnicos, registrar soluções e acompanhar indicadores.

## 🎯 Objetivo

Centralizar informações relacionadas às atividades de manutenção e disponibilizar recursos para:

- Registro de chamados;
- Acompanhamento das ordens de serviço;
- Controle de status;
- Atribuição de técnicos;
- Registro das soluções executadas;
- Consulta e filtragem dos chamados;
- Visualização de indicadores;
- Geração de relatórios.

## ⚙️ Funcionalidades

### Autenticação

- Login de usuários;
- Controle de perfil;
- Perfis de operador e gestor;
- Controle de funcionalidades de acordo com o perfil.

### Gestão de chamados

- Abertura de chamados;
- Geração de número de OS;
- Cadastro de equipamento;
- Classificação do tipo de manutenção;
- Definição de prioridade;
- Alteração de status;
- Atribuição de técnico;
- Registro da solução;
- Exclusão de chamados.

### Consulta e filtros

- Busca por equipamento;
- Filtro por status;
- Filtro por período;
- Atualização dinâmica da tabela.

### Dashboard

Indicadores apresentados no sistema:

- Total de chamados;
- Chamados pendentes;
- Chamados concluídos;
- MTTR médio;
- Distribuição por tipo de manutenção;
- Distribuição por prioridade.

### Relatórios

- Geração de relatório visual;
- Exportação para PDF;
- Relatório em formato A4 paisagem;
- Informações detalhadas dos chamados.

## 🛠️ Tecnologias utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript
- Fetch API
- Chart.js

### Backend

- Node.js
- Express
- CORS
- API REST

### Banco de dados

- SQLite

### Ferramentas

- Visual Studio Code
- Git
- GitHub
- GitHub Desktop

## 🏗️ Arquitetura

```text
Frontend
   │
   │ HTTP / JSON
   ▼
API REST
(Node.js + Express)
   │
   ▼
SQLite