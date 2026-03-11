// =============================
// CLIENTE SUPABASE
// =============================
// Substitua SUPABASE_URL e SUPABASE_ANON_KEY pelos valores do seu projeto
// (Project Settings → API no painel Supabase)

const SUPABASE_URL = 'https://kusrehhcuwarrvjqeghz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3WfecmHmAr2h--6CMrlkyA_SvuwFxmK';

export async function getSupabaseClient() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Cliente singleton (inicializado sob demanda para não quebrar se as chaves não estiverem configuradas)
let _client = null;

export async function supabase() {
  if (!_client) {
    _client = await getSupabaseClient();
  }
  return _client;
}
