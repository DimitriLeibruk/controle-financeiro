// =============================
// UI DE AUTENTICAÇÃO - Modal e header
// =============================

import {
  getUsuario,
  getUsername,
  login,
  cadastrar,
  logout,
  recuperarSenha,
  onAuthStateChange,
  excluirContaComSenha
} from './auth.js';

let isLoginMode = true;

function getEl(id) {
  return document.getElementById(id);
}

function show(el, show = true) {
  if (!el) return;
  el.classList.toggle('hidden', !show);
}

async function atualizarHeader(user) {
  const emailEl = getEl('authUserEmail');
  const btnEntrar = getEl('btnEntrar');
  const btnCadastrar = getEl('btnCadastrar');
  const btnSair = getEl('btnSair');
  const btnExcluirConta = getEl('btnExcluirConta');
  if (!emailEl || !btnEntrar) return;

  if (user?.email) {
    const username = await getUsername();
    emailEl.textContent = username || user.email;
    emailEl.classList.remove('hidden');
    btnEntrar.classList.add('hidden');
    btnCadastrar.classList.add('hidden');
    btnSair.classList.remove('hidden');
    btnExcluirConta?.classList.remove('hidden');
  } else {
    emailEl.classList.add('hidden');
    btnSair.classList.add('hidden');
    btnExcluirConta?.classList.add('hidden');
    btnEntrar.classList.remove('hidden');
    btnCadastrar.classList.remove('hidden');
  }
}

function mostrarMensagem(texto, isError = false) {
  const msg = getEl('authMessage');
  if (!msg) return;
  msg.textContent = texto;
  msg.classList.remove('hidden');
  msg.style.color = isError ? '#dc2626' : '#16a34a';
}

function esconderMensagem() {
  const msg = getEl('authMessage');
  if (msg) msg.classList.add('hidden');
}

function mostrarTelaLogin() {
  show(getEl('authLoginFields'), true);
  show(getEl('authCadastroFields'), false);
  show(getEl('authRecuperarFields'), false);
  show(getEl('authFormActions'), true);
  getEl('authForm')?.classList.remove('hidden');
}

function mostrarTelaCadastro() {
  show(getEl('authLoginFields'), false);
  show(getEl('authCadastroFields'), true);
  show(getEl('authRecuperarFields'), false);
  show(getEl('authFormActions'), true);
  getEl('authForm')?.classList.remove('hidden');
}

function mostrarTelaRecuperar() {
  show(getEl('authLoginFields'), false);
  show(getEl('authCadastroFields'), false);
  show(getEl('authRecuperarFields'), true);
  show(getEl('authFormActions'), false);
  getEl('authEmailRecuperar').value = '';
  esconderMensagem();
}

export function setupAuthUI(atualizarSistema, carregarDados) {
  const modal = getEl('authModal');
  const backdrop = modal?.querySelector('.auth-modal-backdrop');
  const authForm = getEl('authForm');
  const authTitle = getEl('authModalTitle');
  const authSubmit = getEl('authSubmit');
  const authToggleMode = getEl('authToggleMode');
  const btnFechar = getEl('authModalFechar');
  const btnCloseX = getEl('authModalClose');
  const authSubtitle = document.querySelector('.auth-modal-subtitle');
  const authFooterText = getEl('authFooterText');
  const btnEntrar = getEl('btnEntrar');
  const btnCadastrar = getEl('btnCadastrar');
  const btnSair = getEl('btnSair');
  const btnExcluirConta = getEl('btnExcluirConta');
  const authEsqueciSenha = getEl('authEsqueciSenha');
  const authRecuperarFields = getEl('authRecuperarFields');
  const authVoltarLogin = getEl('authVoltarLogin');
  const authEnviarLink = getEl('authEnviarLink');

  function abrirModal(modoLogin) {
    isLoginMode = modoLogin;
    authTitle.textContent = modoLogin ? 'Entrar' : 'Criar conta';
    authSubmit.textContent = modoLogin ? 'Entrar' : 'Cadastrar';
    authToggleMode.textContent = modoLogin ? 'Criar conta' : 'Já tenho conta';
    if (authSubtitle) authSubtitle.textContent = modoLogin ? 'Use e-mail ou usuário e senha para acessar' : 'Preencha os dados abaixo para se cadastrar';
    if (authFooterText) authFooterText.textContent = modoLogin ? 'Não tem conta?' : 'Já tem conta?';
    getEl('authEmailOuUsuario').value = '';
    getEl('authSenha').value = '';
    getEl('authEmailCadastro').value = '';
    getEl('authUsername').value = '';
    getEl('authSenhaCadastro').value = '';
    esconderMensagem();
    if (modoLogin) mostrarTelaLogin();
    else mostrarTelaCadastro();
    modal?.classList.remove('hidden');
  }

  function fecharModal() {
    modal?.classList.add('hidden');
    mostrarTelaLogin();
  }

  btnEntrar?.addEventListener('click', () => abrirModal(true));
  btnCadastrar?.addEventListener('click', () => abrirModal(false));
  btnFechar?.addEventListener('click', fecharModal);
  btnCloseX?.addEventListener('click', fecharModal);
  backdrop?.addEventListener('click', fecharModal);

  authToggleMode?.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    abrirModal(isLoginMode);
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isLoginMode) {
      const emailOuUsuario = getEl('authEmailOuUsuario').value.trim();
      const senha = getEl('authSenha').value;
      if (!emailOuUsuario || !senha) return;
      authSubmit.disabled = true;
      esconderMensagem();
      const result = await login(emailOuUsuario, senha);
      authSubmit.disabled = false;
      if (result.success) {
        fecharModal();
        await atualizarHeader(result.user);
        await carregarDados();
        atualizarSistema();
      } else {
        mostrarMensagem(result.error || 'Erro ao entrar.', true);
      }
    } else {
      const email = getEl('authEmailCadastro').value.trim();
      const username = getEl('authUsername').value.trim();
      const senha = getEl('authSenhaCadastro').value;
      if (!email || !senha) {
        mostrarMensagem('Preencha e-mail e senha.', true);
        return;
      }
      if (username && username.length < 2) {
        mostrarMensagem('Usuário deve ter pelo menos 2 caracteres.', true);
        return;
      }
      authSubmit.disabled = true;
      esconderMensagem();
      const result = await cadastrar(email, senha, username || undefined);
      authSubmit.disabled = false;
      if (result.success) {
        fecharModal();
        await atualizarHeader(result.user);
        await carregarDados();
        atualizarSistema();
      } else {
        mostrarMensagem(result.error || 'Erro ao cadastrar.', true);
      }
    }
  });

  authEsqueciSenha?.addEventListener('click', () => {
    mostrarTelaRecuperar();
  });

  authVoltarLogin?.addEventListener('click', () => {
    mostrarTelaLogin();
    esconderMensagem();
  });

  authEnviarLink?.addEventListener('click', async () => {
    const email = getEl('authEmailRecuperar').value.trim();
    if (!email) {
      mostrarMensagem('Digite o e-mail da conta.', true);
      return;
    }
    authEnviarLink.disabled = true;
    esconderMensagem();
    const result = await recuperarSenha(email);
    authEnviarLink.disabled = false;
    if (result.success) {
      mostrarMensagem('Se o e-mail existir na base, você receberá um link para redefinir a senha. Verifique sua caixa de entrada.');
    } else {
      mostrarMensagem(result.error || 'Erro ao enviar.', true);
    }
  });

  btnSair?.addEventListener('click', async () => {
    await logout();
    await atualizarHeader(null);
    await carregarDados();
    atualizarSistema();
  });

  function fecharDropdownConfiguracoes() {
    const dd = getEl('settingsDropdown');
    const btn = getEl('btnSettings');
    if (dd) dd.classList.add('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  btnExcluirConta?.addEventListener('click', async () => {
    const confirmar = window.confirm(
      'Tem certeza de que deseja excluir sua conta? Essa ação é permanente e não pode ser desfeita.'
    );
    if (!confirmar) return;
    const senha = window.prompt('Para confirmar, digite a senha da sua conta:');
    if (senha === null) return; // usuário cancelou
    if (senha.trim() === '') {
      alert('Digite sua senha para continuar.');
      return;
    }
    fecharDropdownConfiguracoes();
    try {
      const resultado = await excluirContaComSenha(senha.trim());
      if (!resultado.success) {
        alert(resultado.error || 'Não foi possível excluir a conta.');
        return;
      }
      await atualizarHeader(null);
      await carregarDados();
      atualizarSistema();
      alert('Conta excluída com sucesso. Você foi deslogado.');
    } catch (e) {
      console.error('Erro ao excluir conta:', e);
      alert('Ocorreu um erro ao excluir a conta. Tente novamente.');
    }
  });

  getUsuario().then(atualizarHeader);
  onAuthStateChange((user) => {
    atualizarHeader(user);
  });
}
