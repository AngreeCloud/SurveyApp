# Satisfaction Survey App

Aplicação de pesquisa de satisfação com frontend em Next.js e backend em Flask (Python). O backend expõe APIs REST para registrar feedbacks, autenticar admin, gerar estatísticas e exportar dados.

## Funcionalidades

- Registro de feedbacks com níveis: Muito Satisfeito, Satisfeito, Insatisfeito.
- Consulta de feedbacks com filtro por data e limite.
- Login de administrador por senha.
- Estatísticas agregadas por nível de satisfação.
- Exportação dos feedbacks em CSV ou TXT.

## Estrutura do projeto

- Frontend: Next.js (pasta app/)
- Backend: Flask (pasta backend/)
- Banco: PostgreSQL (tabela satisfaction_feedback)

## Endpoints do backend (Flask)

- GET /api/feedback?date=YYYY-MM-DD&limit=100
- POST /api/feedback
	- body: { "satisfaction_level": "Muito Satisfeito" | "Satisfeito" | "Insatisfeito" }
- POST /api/admin/login
	- body: { "password": "..." }
- GET /api/admin/stats?date=YYYY-MM-DD
- GET /api/admin/export?format=csv|txt&date=YYYY-MM-DD

## Funcionamento geral

1. O usuário responde a pesquisa no frontend.
2. O frontend envia o feedback para o backend Flask.
3. O backend grava no PostgreSQL.
4. A área admin consulta estatísticas e exporta relatórios.

## Configuração do backend (Flask)

Crie um arquivo .env (ou defina variáveis de ambiente) com:

- DATABASE_URL=postgresql://usuario:senha@host:porta/banco
- ADMIN_PASSWORD=uma_senha_forte

Instale dependências e rode o servidor:

- pip install -r backend/requirements.txt
- python backend/app.py

O backend inicia em http://localhost:5000

## Configuração do frontend

Instale dependências e rode o frontend:

- pnpm install
- pnpm dev

O frontend inicia em http://localhost:3000

## Observações

- O backend Flask usa CORS liberado para facilitar o desenvolvimento local.
- O frontend deve apontar para a base URL do Flask (ex.: http://localhost:5000).