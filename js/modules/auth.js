// =============================
// AUTENTICAÇÃO - Login, Cadastro, Logout, Recuperação
// =============================

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.js';

/**
 * Retorna o usuário logado ou null.
 */
export async function getUsuario() {
  const sb = await supabase();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/**
 * Retorna a sessão atual (útil para verificar se está logado).
 */
export async function getSessao() {
  const sb = await supabase();
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

/**
 * Retorna o username do perfil do usuário logado (se existir tabela profiles).
 */
export async function getUsername() {
  const user = await getUsuario();
  if (!user?.id) return null;
  try {
    const sb = await supabase();
    const { data } = await sb.from('profiles').select('username').eq('user_id', user.id).single();
    return data?.username ?? null;
  } catch (_) {
    return null;
  }
}

/**
 * Cadastro com e-mail, senha e username (username vai em user_metadata para o trigger criar o perfil).
 * @returns { object } { success: boolean, error?: string, user? }
 */
export async function cadastrar(email, senha, username) {
  const sb = await supabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password: senha,
    options: { data: { username: (username || '').trim() || undefined } }
  });
  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user };
}

/**
 * Login com e-mail e senha.
 * @returns { object } { success: boolean, error?: string, user? }
 */
export async function loginComEmail(email, senha) {
  const sb = await supabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user };
}

/**
 * Obtém o e-mail a partir do username (RPC) para permitir login com usuário.
 */
async function obterEmailPorUsername(username) {
  const sb = await supabase();
  const { data, error } = await sb.rpc('get_email_for_login', { u: username });
  if (error || data == null) return null;
  return data;
}

/**
 * Login com e-mail OU usuário e senha.
 * Se o valor contiver @, trata como e-mail; senão, trata como username e busca o e-mail no banco.
 * @returns { object } { success: boolean, error?: string, user? }
 */
export async function login(emailOuUsuario, senha) {
  const input = (emailOuUsuario || '').trim();
  if (!input || !senha) return { success: false, error: 'Preencha e-mail/usuário e senha.' };
  const isEmail = input.includes('@');
  const email = isEmail ? input : await obterEmailPorUsername(input);
  if (!email) {
    return { success: false, error: isEmail ? 'E-mail ou senha inválidos.' : 'Usuário não encontrado ou senha inválida.' };
  }
  return loginComEmail(email, senha);
}

/**
 * Logout.
 */
export async function logout() {
  const sb = await supabase();
  await sb.auth.signOut();
}

/**
 * Exclui a conta do usuário autenticado após validar a senha.
 * Tenta a Edge Function "delete-user" (apaga dados + remove do Auth); se não existir, usa a RPC (só apaga dados) e faz logout.
 * @returns { object } { success: boolean, error?: string }
 */
export async function excluirContaComSenha(senha) {
  try {
    const user = await getUsuario();
    if (!user?.email) {
      return { success: false, error: 'Nenhum usuário logado.' };
    }
    const sb = await supabase();
    // Revalida senha antes de pedir exclusão
    const { data, error: loginError } = await sb.auth.signInWithPassword({
      email: user.email,
      password: senha
    });
    if (loginError || !data?.user) {
      return { success: false, error: 'Senha incorreta.' };
    }
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      return { success: false, error: 'Não foi possível obter o token de sessão.' };
    }

    let exclusaoOk = false;

    // 1) Tenta a Edge Function (apaga dados + remove usuário do Auth)
    try {
      const url = `${SUPABASE_URL}/functions/v1/delete-user`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        exclusaoOk = true;
      } else if (res.status === 404 || res.status === 401) {
        // Edge Function não existe (404) ou token não validado (401): usa RPC para apagar dados e fazer logout
        const { error: rpcError } = await sb.rpc('delete_current_user_and_data');
        if (!rpcError) exclusaoOk = true;
        else {
          return {
            success: false,
            error: body.error || rpcError?.message || rpcError || 'Não foi possível excluir os dados. Crie a função no Supabase (veja docs/EXCLUSAO_CONTA.md).'
          };
        }
      } else {
        return {
          success: false,
          error: body.error || `Erro do servidor (${res.status}). Não foi possível excluir a conta.`
        };
      }
    } catch (e) {
      // Erro de rede: tenta pelo menos a RPC
      try {
        const { error: rpcError } = await sb.rpc('delete_current_user_and_data');
        if (!rpcError) exclusaoOk = true;
        else {
          return {
            success: false,
            error: rpcError?.message || rpcError || 'Não foi possível excluir a conta. Verifique a conexão e se a função delete_current_user_and_data existe no Supabase.'
          };
        }
      } catch (rpcEx) {
        return {
          success: false,
          error: 'Não foi possível excluir a conta. Verifique sua conexão e a documentação (docs/EXCLUSAO_CONTA.md).'
        };
      }
    }

    if (exclusaoOk) {
      await sb.auth.signOut();
      return { success: true };
    }
    return { success: false, error: 'Não foi possível excluir a conta.' };
  } catch (e) {
    console.error('excluirContaComSenha:', e);
    return {
      success: false,
      error: e?.message || 'Ocorreu um erro inesperado. Tente novamente.'
    };
  }
}

/**
 * Envia e-mail de recuperação de senha para o endereço informado.
 * O usuário recebe um link para redefinir a senha (template configurável no painel Supabase).
 * @returns { object } { success: boolean, error?: string }
 */
export async function recuperarSenha(email) {
  const sb = await supabase();
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${window.location.pathname || '/'}`
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Escuta mudanças de autenticação (login/logout em outra aba, etc.).
 * @param { (user) => void } callback - chamado com o usuário ou null
 */
export function onAuthStateChange(callback) {
  supabase().then((sb) => {
    sb.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  });
}
