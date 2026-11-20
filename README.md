# 📈 PulseBoard

### Monitoramento de uptime e gestão de incidentes para equipes pequenas

[![CI](https://github.com/g4bri3llucas/pulseboard/actions/workflows/ci.yml/badge.svg)](https://github.com/g4bri3llucas/pulseboard/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-TypeScript-3178c6?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker)](https://docs.docker.com/compose/)

> 🚧 Em desenvolvimento. O fluxo principal já funciona de ponta a ponta. Veja o [status](#-status).

---

## 📖 Sobre o projeto

O **PulseBoard** verifica periodicamente se os sites e APIs que você cadastrou estão respondendo. Quando um deles cai, o sistema **abre um incidente** e manda um e-mail. Quando ele volta, **resolve o incidente** e avisa de novo. Cada monitor pode ter uma **página de status pública** para compartilhar com seus usuários.

É um projeto full-stack completo, com API, worker em segundo plano, front-end, banco, containers e CI.

---

## ✨ Funcionalidades

- 🔐 **Autenticação** com cadastro e login, senhas com hash `bcrypt` e sessões via JWT.
- 📡 **CRUD de monitores:** nome, URL, intervalo de checagem (padrão de 60 s) e opção de página pública.
- ⏱️ **Worker de checagem**, um processo separado da API (`node-cron`). A cada 10 s ele busca os monitores que já passaram do intervalo e faz as requisições em paralelo, com timeout de 10 s. Cada checagem salva o status (UP/DOWN) e o tempo de resposta.
- 🚨 **Detecção de incidentes:** a primeira falha abre um incidente e a primeira resposta OK depois disso o resolve. Isso evita incidentes duplicados.
- ✉️ **Alertas por e-mail** com Nodemailer na abertura e na resolução. Em desenvolvimento, os e-mails vão para uma caixa de teste do Ethereal.
- 🌐 **Página de status pública** em `/status/:slug`, sem precisar de login. Só aparece para monitores marcados como públicos.
- ✅ **Validação** com Zod no back-end e com React Hook Form + Zod nos formulários do front.

---

## 🏗️ Arquitetura

```
┌────────────┐   HTTP/JSON   ┌─────────────┐
│  Frontend  │ ────────────► │     API     │──┐
│ React+Vite │               │   Express   │  │
└────────────┘               └─────────────┘  │   ┌──────────────┐
                                              ├──►│  PostgreSQL  │
                             ┌─────────────┐  │   │   (Prisma)   │
          sites monitorados ◄│   Worker    │──┘   └──────────────┘
                             │  node-cron  │──► e-mail (Nodemailer)
                             └─────────────┘
```

A API e o worker usam o mesmo código e a mesma imagem Docker, mas rodam como **processos separados**. Assim, uma checagem lenta nunca trava as requisições da API.

**Modelo de dados:** `User` 1→N `Monitor` 1→N `Check` / `Incident` (índice em `monitorId, checkedAt` para buscar a última checagem).

---

## 🛠️ Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Front-end | React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, React Hook Form, Zod, Axios |
| Back-end | Node.js, TypeScript, Express, Prisma, Zod, JWT, bcrypt, node-cron, Nodemailer |
| Banco | PostgreSQL 16 |
| Infra | Docker, Docker Compose, Nginx (servindo o front), GitHub Actions |
| Testes | Vitest, Supertest, Testing Library |

---

## 🚀 Como rodar

### Com Docker (recomendado)

```bash
git clone https://github.com/g4bri3llucas/pulseboard.git
cd pulseboard
docker compose up --build
```

O comando sobe o Postgres, aplica as migrations e inicia a API, o worker e o front-end:

| Serviço | URL |
| --- | --- |
| Front-end | http://localhost:5173 |
| API | http://localhost:3000 (health check em `/health`) |

### Sem Docker

Você precisa de um PostgreSQL rodando e de um `backend/.env` com `DATABASE_URL`, `JWT_SECRET` e `PORT`.

```bash
# back-end
cd backend
npm install
npx prisma migrate deploy
npm run dev        # API
npm run worker     # worker de checagem (em outro terminal)

# front-end
cd frontend
npm install
VITE_API_URL=http://localhost:3000 npm run dev
```

---

## 🔌 Endpoints da API

| Método | Rota | Autenticação | Descrição |
| --- | --- | :---: | --- |
| `GET` | `/health` | | Health check |
| `POST` | `/auth/register` | | Cadastro |
| `POST` | `/auth/login` | | Login (retorna JWT) |
| `GET` | `/monitors` | ✅ | Lista os monitores do usuário |
| `POST` | `/monitors` | ✅ | Cria um monitor |
| `GET` | `/monitors/:id` | ✅ | Detalhes de um monitor |
| `PATCH` | `/monitors/:id` | ✅ | Atualiza um monitor |
| `DELETE` | `/monitors/:id` | ✅ | Remove um monitor |
| `GET` | `/status/:slug` | | Página de status pública |

---

## 🧪 Testes e CI

A cada push e pull request na `main`, o GitHub Actions roda dois jobs:

- **Backend:** lint, Prisma generate, migrations em um Postgres de serviço, testes unitários e de integração da autenticação, build e build da imagem Docker.
- **Frontend:** lint (oxlint), testes (login e formulário de monitor), build e build da imagem Docker.

```bash
cd backend && npm test
cd frontend && npm test
```

---

## ✅ Status

- [x] Setup do projeto (monorepo com `backend/` e `frontend/`)
- [x] Schema do banco e migrations
- [x] Autenticação (JWT)
- [x] CRUD de monitores
- [x] Worker de checagem
- [x] Detecção de incidentes
- [x] Página de status pública
- [x] Alertas por e-mail (SMTP de teste)
- [x] Docker e Docker Compose
- [x] CI com GitHub Actions
- [ ] Mais testes (monitores, worker, incidentes)
- [ ] SMTP real configurável por variável de ambiente
- [ ] Deploy

---

## 👤 Autor

Desenvolvido por **Gabriel Lucas** · [GitHub](https://github.com/g4bri3llucas) · [LinkedIn](https://www.linkedin.com/in/gabriel-lucas-893a342bb/)
