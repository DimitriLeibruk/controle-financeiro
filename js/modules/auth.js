// =============================
// AUTENTICAÇÃO - Login, Cadastro, Logout, Recuperação
// =============================

import { supabase } from './supabase.js';

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
