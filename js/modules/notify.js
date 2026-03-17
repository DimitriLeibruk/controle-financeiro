// =============================
// NOTIFY - Toasts e Modal (confirm/prompt)
// =============================

let _modalBound = false;
let _resolveModal = null;
let _modalMode = null; // 'confirm' | 'prompt'

function el(id) {
  return document.getElementById(id);
}

function ensureModalBound() {
  if (_modalBound) return;
  _modalBound = true;

  const modal = el('appModal');
  const backdrop = modal?.querySelector('.app-modal-backdrop');
  const btnCancel = el('appModalCancel');
  const btnConfirm = el('appModalConfirm');

  function closeWith(value) {
    if (!modal) return;
    modal.classList.add('hidden');
    const resolver = _resolveModal;
    _resolveModal = null;
    _modalMode = null;
    resolver?.(value);
  }

  backdrop?.addEventListener('click', () => closeWith(null));
  btnCancel?.addEventListener('click', () => closeWith(null));
  btnConfirm?.addEventListener('click', () => {
    if (_modalMode === 'prompt') {
      closeWith(el('appModalInputField')?.value ?? '');
    } else {
      closeWith(true);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (modal?.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeWith(null);
    if (e.key === 'Enter') {
      // evita Enter em textarea (não usamos textarea hoje, mas fica seguro)
      if (document.activeElement?.id === 'appModalInputField') {
        btnConfirm?.click();
      }
    }
  });
}

export function toast(message, options = {}) {
  const host = el('toastHost');
  if (!host) return;

  const {
    type = 'info', // 'success' | 'error' | 'info' | 'warn'
    title = null,
    duration = 3500
  } = options;

  const toastEl = document.createElement('div');
  toastEl.className = `toast toast-${type}`;
  toastEl.setAttribute('role', 'status');

  const iconMap = {
    success: '✓',
    error: '!',
    info: 'i',
    warn: '!'
  };

  toastEl.innerHTML = `
    <div class="toast-icon" aria-hidden="true">${iconMap[type] ?? 'i'}</div>
    <div class="toast-body">
      ${title ? `<p class="toast-title">${title}</p>` : ''}
      <p class="toast-message"></p>
    </div>
    <button class="toast-close" type="button" aria-label="Fechar">✕</button>
  `;

  toastEl.querySelector('.toast-message').textContent = String(message ?? '');

  const closeBtn = toastEl.querySelector('.toast-close');
  let timeoutId = null;

  function remove() {
    if (timeoutId) clearTimeout(timeoutId);
    toastEl.style.animation = 'toastOut 140ms ease forwards';
    setTimeout(() => toastEl.remove(), 160);
  }

  closeBtn?.addEventListener('click', remove);
  host.appendChild(toastEl);

  if (duration !== 0) {
    timeoutId = setTimeout(remove, Math.max(1200, Number(duration) || 0));
  }
}

export function confirmDialog(message, options = {}) {
  ensureModalBound();

  const modal = el('appModal');
  const titleEl = el('appModalTitle');
  const msgEl = el('appModalMessage');
  const inputWrap = el('appModalInput');
  const input = el('appModalInputField');
  const btnCancel = el('appModalCancel');
  const btnConfirm = el('appModalConfirm');

  if (!modal || !titleEl || !msgEl || !btnCancel || !btnConfirm) {
    return Promise.resolve(window.confirm(String(message ?? '')));
  }

  const {
    title = 'Confirmação',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false
  } = options;

  _modalMode = 'confirm';
  titleEl.textContent = title;
  msgEl.textContent = String(message ?? '');
  inputWrap?.classList.add('hidden');
  if (input) input.value = '';
  btnCancel.textContent = cancelText;
  btnConfirm.textContent = confirmText;
  btnConfirm.classList.toggle('app-modal-btn-danger', !!danger);
  btnConfirm.classList.toggle('app-modal-btn-primary', !danger);

  modal.classList.remove('hidden');

  return new Promise((resolve) => {
    _resolveModal = (val) => resolve(val === true);
  });
}

export function promptDialog(message, options = {}) {
  ensureModalBound();

  const modal = el('appModal');
  const titleEl = el('appModalTitle');
  const msgEl = el('appModalMessage');
  const inputWrap = el('appModalInput');
  const input = el('appModalInputField');
  const btnCancel = el('appModalCancel');
  const btnConfirm = el('appModalConfirm');

  if (!modal || !titleEl || !msgEl || !inputWrap || !input || !btnCancel || !btnConfirm) {
    const val = window.prompt(String(message ?? ''), options.defaultValue ?? '');
    return Promise.resolve(val);
  }

  const {
    title = 'Digite um valor',
    placeholder = '',
    defaultValue = '',
    type = 'text',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false
  } = options;

  _modalMode = 'prompt';
  titleEl.textContent = title;
  msgEl.textContent = String(message ?? '');
  inputWrap.classList.remove('hidden');
  input.type = type;
  input.placeholder = placeholder;
  input.value = String(defaultValue ?? '');
  btnCancel.textContent = cancelText;
  btnConfirm.textContent = confirmText;
  btnConfirm.classList.toggle('app-modal-btn-danger', !!danger);
  btnConfirm.classList.toggle('app-modal-btn-primary', !danger);

  modal.classList.remove('hidden');

  // foco no input
  setTimeout(() => input.focus(), 0);

  return new Promise((resolve) => {
    _resolveModal = (val) => resolve(val === null ? null : String(val));
  });
}

