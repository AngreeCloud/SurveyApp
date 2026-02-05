# App de Inquérito de Satisfação

Aplicação de feedback com backend em Flask (Python) e base de dados PostgreSQL (Neon). O painel de administração e o quiosque são servidos diretamente a partir das templates do Flask.

## Funcionalidades

- Registo de feedback com níveis: Muito Satisfeito, Satisfeito, Insatisfeito.
- Painel administrativo com PIN de acesso.
- Estatísticas agregadas por nível de satisfação.
- Gráfico de barras (Chart.js) e gráfico circular.
- Histórico com filtros por data e por mês, ordenação por data e paginação.
- Exportação em .csv e .txt tabular.
- Sequência diária por nível (reset diário) e totais gerais no painel.
- Página de comparação de períodos (dia/semana/mês/ano).
- Botão de refresh e ajuda com instruções completas.

## Rotas principais

- GET / -> Painel administrativo (PIN)
- GET /kiosk -> Quiosque de feedback
- GET /compare -> Comparação de períodos

## Endpoints do backend (Flask)

- GET /api/feedback?date=YYYY-MM-DD&limit=100
- POST /api/feedback
	- body: { "satisfaction_level": "Muito Satisfeito" | "Satisfeito" | "Insatisfeito" }
- POST /api/admin/login
	- body: { "password": "..." }
- GET /api/admin/stats?date=YYYY-MM-DD
- GET /api/admin/export?format=csv|txt&date=YYYY-MM-DD
- GET /api/feedback/range?start=YYYY-MM-DD&end=YYYY-MM-DD

## Configuração local

Crie um ficheiro .env (ou defina variáveis de ambiente) com:

- DATABASE_URL=postgresql://usuario:senha@host:porta/banco
- ADMIN_PASSWORD=uma_password_forte

Instalar dependências e executar:

- pip install -r backend/requirements.txt
- python backend/app.py

Aplicação disponível em http://localhost:5000

## Deploy no Replit

Aplicação em produção:

https://survey-app--AngreeCloud.replit.app

## Configuração no Replit

1. Abrir o projeto no Replit.
2. Definir o diretório de trabalho para backend.
3. Build Command: pip install -r requirements.txt
4. Start Command: python app.py
5. Variáveis de ambiente:
	- DATABASE_URL
	- ADMIN_PASSWORD

## Observações

- O exportador CSV usa separador ";" e BOM UTF-8 para compatibilidade com Excel.
- O TXT exportado é tabular (TSV), adequado para importação.
- O painel mostra cliques diários (reset diário) e total geral com percentagem.
- Para produção, recomenda-se definir uma password forte para ADMIN_PASSWORD.