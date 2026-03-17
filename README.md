# Finance Control

Aplicação web (HTML/CSS/JS) para controle financeiro mensal, com autenticação via Supabase, dashboard, transações (incluindo despesas parceladas) e exportações.

## Demo (site publicado)

- **Acessar**: `https://finctrlweb.netlify.app/`

## Como rodar

- **Opção 1 (VSCode/Cursor)**: use a extensão **Live Server** e abra `index.html`.
- **Opção 2 (Python)**:

```bash
python -m http.server 5500
```

Depois acesse `http://127.0.0.1:5500/`.

## Configuração do Supabase

O app usa Supabase para autenticação e persistência de dados.

### 1) Definir URL e chave no frontend

Edite:

- `js/modules/supabase.js`

E configure:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Esses valores ficam em **Project Settings → API** no Supabase.

### 2) Criar tabela e RLS

No Supabase, vá em **SQL Editor** e execute o arquivo:

- `supabase/schema.sql`

Isso cria `public.user_data` com RLS para cada usuário acessar somente seus dados.

### 3) Exclusão de conta (dados + usuário)

Para exclusão completa (remover também do Auth), use uma **Edge Function** no Supabase.

- **RPC (apagar dados do app)**: execute `supabase/delete_user.sql` no SQL Editor.
- **Edge Function `delete-user` (apagar usuário do Auth)**:
  - crie a função no painel do Supabase com o código equivalente e faça deploy.
  - configure os **Secrets** necessários na função (ex.: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
  - se a chamada da função retornar **401**, faça deploy com verificação JWT desativada (ex.: `--no-verify-jwt`) conforme recomendado pelo Supabase.

## Estrutura do projeto

- `index.html`: layout principal
- `css/`: estilos
- `js/`: código principal
  - `js/main.js`: orquestração e listeners
  - `js/modules/`: módulos (auth, forms, storage, etc.)
- `supabase/`: scripts SQL para o banco

