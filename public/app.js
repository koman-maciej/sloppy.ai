// ============================
//  sloppy.ai — Frontend Logic
// ============================

// ── DOM refs ────────────────────────────────────────────
const loginScreen      = document.getElementById('login-screen');
const registerScreen   = document.getElementById('register-screen');
const chatScreen       = document.getElementById('chat-screen');
const loginForm        = document.getElementById('login-form');
const loginError       = document.getElementById('login-error');
const loginBtn         = document.getElementById('login-btn');
const registerLink     = document.getElementById('register-link');
const backToLogin      = document.getElementById('back-to-login');
const registerForm     = document.getElementById('register-form');
const registerError    = document.getElementById('register-error');
const registerBtn      = document.getElementById('register-btn');
const logoutBtn        = document.getElementById('logout-btn');
const chatForm         = document.getElementById('chat-form');
const chatInput        = document.getElementById('chat-input');
const sendBtn          = document.getElementById('send-btn');
const messages         = document.getElementById('messages');
const chatUsername     = document.getElementById('chat-username');
const newChatBtn       = document.getElementById('new-chat-btn');
const conversationList = document.getElementById('conversations-list');
const sidebarToggle    = document.getElementById('sidebar-toggle');
const sidebar          = document.getElementById('sidebar');

// ── State ───────────────────────────────────────────────
let activeConvId    = null;
let pendingNewChat  = false; // true = nowy czat gotowy, ale jeszcze niezapisany w DB
const TEMP_CONV_ID  = '__temp__';

// ── Utils ──────────────────────────────────────────────

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.classList.remove('hidden');
}
function clearLoginError() {
  loginError.textContent = '';
  loginError.classList.add('hidden');
}
function showRegisterError(msg) {
  registerError.textContent = msg;
  registerError.classList.remove('hidden');
}
function clearRegisterError() {
  registerError.textContent = '';
  registerError.classList.add('hidden');
}

function showScreen(name) {
  loginScreen.classList.add('hidden');
  registerScreen.classList.add('hidden');
  chatScreen.classList.add('hidden');
  if (name === 'login')    loginScreen.classList.remove('hidden');
  if (name === 'register') registerScreen.classList.remove('hidden');
  if (name === 'chat')     chatScreen.classList.remove('hidden');
}

// ── Session check ───────────────────────────────────────
async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      chatUsername.textContent = data.username;
      showScreen('chat');
      await loadConversations();
    } else {
      showScreen('login');
    }
  } catch {
    showScreen('login');
  }
}

// ── Login ───────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearLoginError();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logowanie…';
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showLoginError(data.error || 'Logowanie nieudane.');
    } else {
      chatUsername.textContent = data.username;
      loginForm.reset();
      showScreen('chat');
      await loadConversations();
    }
  } catch {
    showLoginError('Błąd sieci. Spróbuj ponownie.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// ── Register navigation ─────────────────────────────────
registerLink.addEventListener('click', (e) => {
  e.preventDefault();
  clearLoginError();
  registerForm.reset();
  clearRegisterError();
  showScreen('register');
});

backToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  clearRegisterError();
  showScreen('login');
});

// ── Register ────────────────────────────────────────────
function validateRegisterForm() {
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const birthDate = document.getElementById('reg-birthdate').value;
  const username  = document.getElementById('reg-username').value.trim();
  const password  = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;

  const nameRe     = /^[A-Za-zÀ-ÖØ-öø-żŁłĄąĆćĘęŃńÓóŚśŹźŻż]{2,}$/;
  const emailRe    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRe = /^[a-zA-Z0-9_.]{3,32}$/;

  if (!nameRe.test(firstName)) return 'Imię musi mieć min. 2 litery i zawierać tylko litery.';
  if (!nameRe.test(lastName))  return 'Nazwisko musi mieć min. 2 litery i zawierać tylko litery.';
  if (!emailRe.test(email))    return 'Podaj prawidłowy adres email.';
  if (!birthDate)              return 'Podaj datę urodzenia.';
  const parsed = new Date(birthDate);
  if (isNaN(parsed.getTime())) return 'Podaj prawidłową datę urodzenia.';
  if (!usernameRe.test(username)) return 'Login: 3–32 znaki, tylko litery, cyfry, podkreślnik i kropka.';
  if (password.length < 8)     return 'Hasło musi mieć co najmniej 8 znaków.';
  if (password !== password2)  return 'Hasła nie są identyczne.';
  return null;
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearRegisterError();
  const err = validateRegisterForm();
  if (err) { showRegisterError(err); return; }

  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const birthDate = document.getElementById('reg-birthdate').value;
  const username  = document.getElementById('reg-username').value.trim();
  const password  = document.getElementById('reg-password').value;

  registerBtn.disabled = true;
  registerBtn.textContent = 'Rejestracja…';
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, firstName, lastName, email, birthDate })
    });
    const data = await res.json();
    if (!res.ok) { showRegisterError(data.error || 'Rejestracja nieudana.'); return; }

    // Auto-login
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok) {
      chatUsername.textContent = loginData.username;
      registerForm.reset();
      showScreen('chat');
      await loadConversations();
    } else {
      showScreen('login');
    }
  } catch {
    showRegisterError('Błąd sieci. Spróbuj ponownie.');
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Zarejestruj się';
  }
});

// ── Logout ──────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  activeConvId   = null;
  pendingNewChat = false;
  removeTempConvItem();
  conversationList.innerHTML = '';
  clearMessages();
  showScreen('login');
});

// ── Sidebar toggle ──────────────────────────────────────
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// ── Conversations ───────────────────────────────────────
async function loadConversations() {
  try {
    const res = await fetch('/api/conversations');
    if (!res.ok) return;
    const convs = await res.json();
    renderConversationList(convs);
  } catch {}
}

function renderConversationList(convs) {
  conversationList.innerHTML = '';
  if (convs.length === 0) {
    conversationList.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;padding:0.5rem 0.75rem;">Brak historii czatów</p>';
    return;
  }
  convs.forEach(conv => addConvItemToList(conv));
}

function addConvItemToList(conv, prepend = false) {
  // Remove placeholder if present
  const placeholder = conversationList.querySelector('p');
  if (placeholder) placeholder.remove();

  const existing = document.getElementById('conv-' + conv._id);
  if (existing) { existing.querySelector('.conv-item-title').textContent = conv.title; return; }

  const item = document.createElement('div');
  item.className = 'conv-item' + (conv._id === activeConvId ? ' active' : '');
  item.id = 'conv-' + conv._id;
  item.innerHTML = `
    <span class="conv-item-title">${escapeHtml(conv.title)}</span>
    <button class="conv-item-delete" title="Usuń czat" data-id="${conv._id}">✕</button>
  `;
  item.addEventListener('click', (e) => {
    if (e.target.closest('.conv-item-delete')) return;
    openConversation(conv._id);
  });
  item.querySelector('.conv-item-delete').addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteConversation(conv._id);
  });

  if (prepend) {
    conversationList.prepend(item);
  } else {
    conversationList.appendChild(item);
  }
}

function setActiveConv(id) {
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  if (id) {
    const el = document.getElementById('conv-' + id);
    if (el) el.classList.add('active');
  }
  activeConvId = id;
  updateSendBtn();
}

function updateSendBtn() {
  sendBtn.disabled = chatInput.value.trim() === '';
}

function removeTempConvItem() {
  const el = document.getElementById('conv-' + TEMP_CONV_ID);
  if (el) el.remove();
  // Przywróć placeholder jeśli lista pusta
  if (conversationList.children.length === 0) {
    conversationList.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;padding:0.5rem 0.75rem;">Brak historii czatów</p>';
  }
}

async function openConversation(id) {
  removeTempConvItem();
  pendingNewChat = false;
  setActiveConv(id);
  clearMessages();
  try {
    const res = await fetch('/api/conversations/' + id);
    if (!res.ok) return;
    const conv = await res.json();
    conv.messages.forEach(msg => appendMessage(msg.role, msg.content));
  } catch {}
}

async function deleteConversation(id) {
  await fetch('/api/conversations/' + id, { method: 'DELETE' });
  const el = document.getElementById('conv-' + id);
  if (el) el.remove();
  if (activeConvId === id) {
    setActiveConv(null);
    clearMessages();
  }
  if (conversationList.children.length === 0) {
    conversationList.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;padding:0.5rem 0.75rem;">Brak historii czatów</p>';
  }
}

// ── New chat ────────────────────────────────────────────
newChatBtn.addEventListener('click', () => {
  // Nie twórz czatu w DB — poczekaj na pierwszą wiadomość
  removeTempConvItem();   // usuń poprzedni tymczasowy jeśli był
  pendingNewChat = true;

  // Dodaj tymczasowy wpis na górze listy
  const placeholder = conversationList.querySelector('p');
  if (placeholder) placeholder.remove();

  const item = document.createElement('div');
  item.className = 'conv-item active';
  item.id = 'conv-' + TEMP_CONV_ID;
  item.innerHTML = `<span class="conv-item-title" style="color:var(--text-muted);font-style:italic">Nowy czat</span>`;
  conversationList.prepend(item);

  activeConvId = null;
  clearMessages();
  chatInput.focus();
  updateSendBtn();
});

// ── Messages ────────────────────────────────────────────
function clearMessages() {
  messages.innerHTML = `
    <div class="welcome-msg" id="welcome-msg">
      <p>👋 Cześć! Jestem <strong>sloppy.ai</strong>.<br/>Kliknij <em>Nowy czat</em>, żeby zacząć.</p>
    </div>`;
}

function appendMessage(role, text) {
  const welcome = document.getElementById('welcome-msg');
  if (welcome) welcome.remove();

  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role}`;
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;

  bubble.textContent = text;

  row.appendChild(avatar);
  row.appendChild(bubble);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return row;
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.id = 'typing-row';
  const avatar = document.createElement('div');
  avatar.className = 'avatar bot';
  avatar.textContent = '🤖';
  const bubble = document.createElement('div');
  bubble.className = 'bubble bot';
  bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
  row.appendChild(avatar);
  row.appendChild(bubble);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing-row');
  if (t) t.remove();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Send message ─────────────────────────────────────────
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  // Jeśli nie mamy aktywnego czatu (nowy lub żaden) — utwórz w DB teraz
  if (!activeConvId) {
    try {
      const newRes = await fetch('/api/conversations', { method: 'POST' });
      if (!newRes.ok) return;
      const newConv = await newRes.json();
      removeTempConvItem();          // usuń tymczasowy wpis
      addConvItemToList(newConv, true);
      setActiveConv(newConv._id);
    } catch { return; }
  }
  pendingNewChat = false;

  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;

  appendMessage('user', text);
  showTyping();

  try {
    const res = await fetch(`/api/conversations/${activeConvId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    removeTyping();

    if (res.status === 401) { showScreen('login'); return; }

    const data = await res.json();
    appendMessage('bot', data.reply || 'Coś poszło nie tak…');

    // Update title in sidebar if it changed (first message)
    if (data.title) {
      const titleEl = document.querySelector(`#conv-${activeConvId} .conv-item-title`);
      if (titleEl) titleEl.textContent = data.title;
    }

    // Move active conv to top of list
    const convEl = document.getElementById('conv-' + activeConvId);
    if (convEl && convEl !== conversationList.firstChild) {
      conversationList.prepend(convEl);
    }
  } catch {
    removeTyping();
    appendMessage('bot', 'Błąd sieci. Spróbuj ponownie.');
  } finally {
    updateSendBtn();
    chatInput.focus();
  }
});

// Auto-resize textarea + aktualizuj przycisk send
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
  updateSendBtn();
});

// Send on Enter (Shift+Enter = newline)
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

// ── Boot ────────────────────────────────────────────────
checkSession();
