# Passo a passo: excluir conta do usuário

Este guia explica como fazer a exclusão de conta funcionar no Finance Control.

---

## O que já está pronto no app

- Botão **Excluir conta** em Configurações (quando logado).
- Confirmação e pedido de senha.
- Chamada para a função `delete_current_user_and_data` no Supabase.

Falta apenas criar essa função no banco e, se quiser, apagar também o usuário do Auth (opcional).

---

## Parte 1 – Apagar os dados do usuário (obrigatório)

Assim o botão “Excluir conta” passa a apagar **todos os dados** do usuário (transações, metas, salário, etc.).

### Passo 1.1 – Abrir o SQL Editor do Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Abra o projeto do **Finance Control**.
3. No menu lateral, clique em **SQL Editor**.

### Passo 1.2 – Executar o script de exclusão

1. Clique em **New query**.
2. Abra o arquivo `supabase/delete_user.sql` do projeto e copie **todo** o conteúdo.
3. Cole no editor do Supabase.
4. Clique em **Run** (ou Ctrl+Enter).

Se não der erro, a função `delete_current_user_and_data` foi criada e o app já pode usá-la.

### Passo 1.3 – Testar no app

1. Faça login no Finance Control.
2. Abra **Configurações** (ícone de engrenagem).
3. Clique em **Excluir conta**.
4. Confirme e digite sua senha.

O esperado:

- Os dados do usuário são apagados (`user_data` e `profiles`).
- O app faz logout.
- O usuário **continua existindo** no Auth (e-mail/senha), mas sem dados no app. Se fizer login de novo, verá tudo zerado.

---

## Parte 2 – Apagar o usuário do Auth também (opcional)

Se quiser que a conta seja **removida de verdade** (incluindo e-mail no Auth, para não poder mais fazer login com ela), é preciso usar a **Service Role Key** em um backend. No Supabase isso é feito com uma **Edge Function**.

### Passo 2.1 – Criar a Edge Function no Supabase

1. No projeto, vá em **Edge Functions** no menu lateral.
2. Clique em **Create a new function**.
3. Nome sugerido: `delete-user`.
4. Apague o conteúdo padrão e use o código abaixo.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Obter o usuário com o token JWT: usar cliente ANON + header do usuário (evita 401)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cliente com Service Role para apagar dados e remover do Auth
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1) Apagar dados do app
    await supabaseAdmin.from('user_data').delete().eq('user_id', user.id)
    await supabaseAdmin.from('profiles').delete().eq('user_id', user.id)

    // 2) Remover usuário do Auth (só funciona com Service Role)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Erro ao excluir conta' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Importante:** no Supabase, a variável `SUPABASE_ANON_KEY` já existe automaticamente no ambiente das Edge Functions. Se o deploy reclamar que não existe, em **Edge Functions → sua função → Settings** adicione em "Secrets" uma variável com o nome exato `SUPABASE_ANON_KEY` e o valor da chave **anon/public** (Project Settings → API).

5. Salve e faça o **Deploy** da função.

**Se a chamada da função retornar 401 (Unauthorized):** o gateway do Supabase pode estar rejeitando o JWT (comum com chaves assimétricas). O app já envia o header `apikey` com a chave anon. Se ainda der 401, faça o deploy da função com verificação JWT desativada no gateway (a função continua validando o usuário internamente):
- Com **Supabase CLI** no projeto: `supabase functions deploy delete-user --no-verify-jwt`
- Ou no Dashboard: em **Edge Functions → delete-user → Details/Settings**, veja se existe a opção "Verify JWT" e desative.

### Passo 2.2 – Chamar a Edge Function pelo app

O app **já está configurado** para chamar a Edge Function. Ao clicar em “Excluir conta”, o fluxo é:

1. O usuário confirma e digita a senha.
2. O app valida a senha (login) e pega o **token da sessão** (`access_token`).
3. O app envia um `POST` para:
   - **URL:** `https://SEU_PROJECT_REF.supabase.co/functions/v1/delete-user`
   - **Header:** `Authorization: Bearer <token da sessão>`

Isso está implementado em:

- **`js/modules/supabase.js`** – exporta `SUPABASE_URL` para montar a URL da função.
- **`js/modules/auth.js`** – na função `excluirContaComSenha`:
  - após validar a senha, usa `data.session.access_token`;
  - faz `fetch(SUPABASE_URL + '/functions/v1/delete-user', { method: 'POST', headers: { Authorization: 'Bearer ' + accessToken } })`;
  - se a resposta for sucesso, faz logout e retorna sucesso; senão, retorna o `error` que a Edge Function enviar.

A URL da Edge Function é montada a partir de `SUPABASE_URL` em `js/modules/supabase.js`. **Ela precisa ser exatamente a do mesmo projeto** onde você fez o deploy da função (e onde estão login e dados). Confira em **Project Settings → API** no Supabase: o "Project URL" deve ser igual ao `SUPABASE_URL` do app. Se o app usar uma URL diferente (ex.: typo no final, `qeghz` vs `qegha`), a requisição vai para outro projeto e a exclusão total não ocorre.

---

## Resumo

| O que fazer | Onde |
|-------------|------|
| Rodar o SQL da função de exclusão | Supabase → SQL Editor → `supabase/delete_user.sql` |
| Testar “Excluir conta” no app | Configurações → Excluir conta |
| (Opcional) Remover usuário do Auth | Edge Function `delete-user` + chamada do app |

Depois do **Parte 1**, o botão “Excluir conta” já funciona e apaga todos os dados do usuário no banco.
