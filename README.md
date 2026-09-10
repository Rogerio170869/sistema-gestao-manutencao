# Sistema de Gestão de Manutenção

Aplicação web para gerenciamento de chamados e atividades de manutenção, com autenticação de usuários, controle de perfis, API REST, banco de dados SQLite, indicadores operacionais e geração de relatórios.

Projeto desenvolvido como parte de um portfólio prático voltado ao desenvolvimento de sistemas, aplicando conceitos de análise, desenvolvimento, integração entre frontend e backend e gestão de informações de manutenção.

---

## 📋 Sobre o projeto

O **Sistema de Gestão de Manutenção** foi desenvolvido para representar um cenário de manutenção industrial, permitindo centralizar informações relacionadas aos chamados e às ordens de serviço.

A aplicação permite que usuários registrem e acompanhem o andamento dos chamados, atribuam técnicos, registrem soluções executadas e analisem indicadores operacionais.

O projeto também contempla recursos de autenticação e autorização, validação de dados no backend e testes automatizados.

---

## 🎯 Objetivos

O sistema foi desenvolvido com os seguintes objetivos:

* Centralizar informações de manutenção;
* Registrar e acompanhar chamados;
* Controlar o ciclo de atendimento das ordens de serviço;
* Organizar informações de equipamentos e técnicos;
* Registrar soluções executadas;
* Disponibilizar filtros e consultas;
* Apresentar indicadores de manutenção;
* Gerar relatórios operacionais;
* Aplicar autenticação e controle de acesso;
* Praticar o desenvolvimento de uma aplicação full stack.

---

## ⚙️ Funcionalidades

### 🔐 Autenticação e segurança

* Login de usuários;
* Autenticação baseada em JWT;
* Senhas armazenadas utilizando hash;
* Controle de acesso por perfil;
* Perfis de operador e gestor;
* Proteção de funcionalidades conforme o perfil;
* Configuração de informações sensíveis por variáveis de ambiente;
* Restrição de origens CORS;
* Validação dos dados recebidos pela API.

### 🛠️ Gestão de chamados

* Abertura de chamados;
* Geração de número de OS;
* Cadastro de equipamento;
* Classificação do tipo de manutenção;
* Definição de prioridade;
* Definição de status;
* Atribuição de técnico;
* Registro da solução executada;
* Registro dos dados de abertura e conclusão;
* Exclusão de chamados.

### 🔎 Consulta e filtros

* Pesquisa por equipamento;
* Filtro por status;
* Filtro por período;
* Atualização dinâmica dos dados;
* Consulta dos chamados cadastrados.

### 📊 Painel de controle

O sistema apresenta indicadores para acompanhamento da operação de manutenção:

* Total de chamados;
* Chamados abertos e em andamento;
* Chamados concluídos;
* Chamados críticos em aberto;
* MTTR médio;
* MTBF médio;
* Taxa de conclusão;
* Distribuição por tipo de manutenção;
* Distribuição por prioridade;
* Equipamentos com maior quantidade de falhas corretivas.

### 📄 Relatórios

* Geração de relatório visual;
* Exportação para PDF;
* Formato A4 em orientação horizontal;
* Informações detalhadas dos chamados.

---

## 🏗️ Arquitetura

A aplicação utiliza uma arquitetura baseada na separação entre interface, API e persistência de dados.

```text
┌─────────────────────────────┐
│          Frontend           │
│       HTML + CSS + JS       │
└──────────────┬──────────────┘
               │
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│          API REST           │
│      Node.js + Express      │
└──────────────┬──────────────┘
               │
               │ SQL
               ▼
┌─────────────────────────────┐
│           SQLite            │
│      Banco de dados local   │
└─────────────────────────────┘
```

---

## 💻 Tecnologias utilizadas

### Front-end

* HTML5
* CSS3
* JavaScript
* API Fetch
* Chart.js

### Backend

* Node.js
* Express
* API REST
* CORS
* JWT
* bcrypt

### Banco de dados

* SQLite

### Testes

* Jest
* Supertest

### Ferramentas

* Visual Studio Code
* Git
* GitHub
* GitHub Desktop

---

## 🧪 Testes automatizados

O projeto possui testes automatizados para validação das principais funcionalidades da API.

Situação atual:

```text
Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Snapshots:   0 total
```

Os testes abrangem funcionalidades relacionadas a:

* Funcionamento da API;
* Autenticação;
* Geração e validação de token;
* Controle de acesso;
* Autorização por perfil;
* Operações com chamados;
* Validação de dados;
* Controle de status;
* Registro de chamados;
* Regras de negócio.

Para executar os testes:

```bash
npm test
```

---

## 🚀 Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/Rogerio170869/sistema-gestao-manutencao.git
```

### 2. Acessar a pasta

```bash
cd sistema-gestao-manutencao
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto.

Exemplo:

```env
JWT_SECRET=uma_chave_secreta_forte
DEFAULT_OPERATOR_PASSWORD=defina_uma_senha
DEFAULT_ADMIN_PASSWORD=defina_uma_senha
```

> Não utilize as senhas acima como senhas reais. O arquivo `.env` não deve ser enviado para o GitHub.

### 5. Iniciar o servidor

```bash
node server.js
```

Uma API será disponibilizada localmente na porta configurada pelo projeto.

---

## 📁 Estrutura principal

```text
sistema-gestao-manutencao/
│
├── index.html
├── script.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
├── .gitignore
│
└── tests/
    └── ...
```

Arquivos gerados localmente, como banco de dados SQLite, dependências e informações sensíveis de configuração, não devem ser versionados.

---

## 🔒 Boas práticas aplicadas

Durante o desenvolvimento foram aplicadas práticas de segurança e organização:

* Senhas não armazenadas em texto puro;
* Autenticação utilizando JWT;
* Variáveis sensíveis definidas por `.env`;
* `.env` não incluído no repositório;
* Banco de dados local não versionado;
* Diretório `node_modules` não versionado;
* Validação de entradas no backend;
* Validação dos valores permitidos para tipo e prioridade;
* Controle de acesso baseado em perfil;
* Configuração restritiva do CORS;
* Testes automatizados para validação das funcionalidades.

---

## 📈 Indicadores de manutenção

O sistema utiliza indicadores normalmente associados à gestão de manutenção, permitindo transformar os registros dos chamados em informações para acompanhamento operacional.

Entre os indicadores implementados estão:

**MTTR — Tempo Médio para Reparo**

Representa o tempo médio utilizado para reparo dos equipamentos.

**MTBF — Tempo Médio Entre Falhas**

Representa o intervalo médio entre falhas.

**Taxa de conclusão**

Permite acompanhar a proporção de chamados concluídos em relação ao total registrado.

Esses indicadores ajudam a demonstrar a aplicação prática de conceitos de manutenção dentro de uma solução de software.

---

## 🎓 Objetivo como projeto de portfólio

Este projeto foi desenvolvido com foco na demonstração prática de conhecimentos em:

* Análise e desenvolvimento de sistemas;
* Desenvolvimento web;
* JavaScript;
* Node.js;
* APIs REST;
* Banco de dados;
* Autenticação e autorização;
* Segurança básica de aplicações;
* Testes automatizados;
* Git e GitHub;
* Organização e documentação de projetos.

Além do desenvolvimento de software, o projeto busca demonstrar a integração entre **conhecimento técnico de manutenção industrial e desenvolvimento de sistemas**.

---

## 📌 Status do projeto

**Concluído — versão de portfólio**

O projeto encontra-se funcional, com autenticação, gerenciamento de chamados, dashboard, relatórios, validações de backend e testes automatizados.

Novas funcionalidades poderão ser adicionadas futuramente conforme a evolução do portfólio.

---

## 👨‍💻 Autor

**Rogério Motta**

Projeto desenvolvido para composição de portfólio profissional na área de Tecnologia da Informação e desenvolvimento de sistemas.

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de portfólio.
