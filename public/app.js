// ============================
//  sloppy.ai — Frontend Logic
// ============================

const loginScreen  = document.getElementById('login-screen');
const chatScreen   = document.getElementById('chat-screen');
const loginForm    = document.getElementById('login-form');
const loginError   = document.getElementById('login-error');
const loginBtn     = document.getElementById('login-btn');
const registerLink = document.getElementById('register-link');
const logoutBtn    = document.getElementById('logout-btn');
const chatForm     = document.getElementById('chat-form');
const chatInput    = document.getElementById('chat-input');
const sendBtn      = document.getElementById('send-btn');
const messages     = document.getElementById('messages');
const chatUsername = document.getElementById('chat-username');

// ── Utils ──────────────────────────────────────────────

function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.remove('hidden');
}

function clearError() {
  loginError.textContent = '';
  loginError.classList.add('hidden');
}

function showScreen(name) {
  loginScreen.classList.add('hidden');
  chatScreen.classList.add('hidden');
  if (name === 'login') loginScreen.classList.remove('hidden');
  if (name === 'chat')  chatScreen.classList.remove('hidden');
}

// ── Auth: check current session ─────────────────────────

async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      chatUsername.textContent = data.username;
      showScreen('chat');
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
  clearError();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Login failed.');
    } else {
      chatUsername.textContent = data.username;
      loginForm.reset();
      showScreen('chat');
    }
  } catch {
    showError('Network error. Please try again.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// ── Register link (quick register flow) ────────────────

registerLink.addEventListener('click', async (e) => {
  e.preventDefault();
  clearError();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('Fill in username and password to register.');
    return;
  }
  if (password.length < 4) {
    showError('Password must be at least 4 characters.');
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Registration failed.');
    } else {
      // Auto-login after register
      loginForm.dispatchEvent(new Event('submit'));
    }
  } catch {
    showError('Network error. Please try again.');
  }
});

// ── Logout ──────────────────────────────────────────────

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  messages.innerHTML = `
    <div class="welcome-msg">
      <p>👋 Cześć! Jestem <strong>sloppy.ai</strong>. Napisz coś, a odpowiem!</p>
    </div>`;
  showScreen('login');
});

// ── Chat ────────────────────────────────────────────────

function appendMessage(role, text) {
  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role}`;
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;

  if (role === 'bot') {
    // Find the echo portion and italicise it
    // Format: Cześć, powiedziałeś: "...", pozwól...
    const echoMatch = text.match(/^(.*?")(.*?)(",.*)$/s);
    if (echoMatch) {
      const before = document.createTextNode(echoMatch[1]);
      const italic = document.createElement('em');
      italic.className = 'echo-text';
      italic.textContent = echoMatch[2];
      const after = document.createTextNode(echoMatch[3]);
      bubble.appendChild(before);
      bubble.appendChild(italic);
      bubble.appendChild(after);
    } else {
      bubble.textContent = text;
    }
  } else {
    bubble.textContent = text;
  }

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

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;

  appendMessage('user', text);
  showTyping();

  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    removeTyping();

    if (res.status === 401) {
      showScreen('login');
      return;
    }

    const data = await res.json();
    appendMessage('bot', data.reply || 'Coś poszło nie tak…');
  } catch {
    removeTyping();
    appendMessage('bot', 'Błąd sieci. Spróbuj ponownie.');
  } finally {
    sendBtn.disabled = false;
    chatInput.focus();
  }
});

// Auto-resize textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
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
