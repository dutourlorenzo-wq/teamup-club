const STORAGE_KEY = 'TEAMUP_SECURE_STARTER_V1';

const state = loadState();
const session = { value: null };

function freshState() {
  return {
    users: [],
    clubs: [],
    messages: [],
    news: [],
    members: [],
    resetRequests: []
  };
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return raw ? { ...freshState(), ...raw } : freshState();
  } catch {
    return freshState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return `TU${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.style.display = 'block';
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    el.style.display = 'none';
  }, 2500);
}

function usernameFrom(first, last) {
  return (first + '.' + last)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '');
}

function currentClub() {
  if (!session.value) return null;
  return state.clubs.find((club) => club.id === session.value.clubId) || null;
}

function currentUser() {
  return session.value;
}

function openPage(pageName, button) {
  document.querySelectorAll('.page').forEach((page) => page.classList.add('hidden'));
  const target = document.getElementById(`page-${pageName}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('#mainNav button').forEach((btn) => btn.classList.remove('active'));
  if (button) button.classList.add('active');

  render();
}

function switchTab(tabName) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  document.getElementById('tabLogin').classList.toggle('active', tabName === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tabName === 'register');
  loginForm.classList.toggle('hidden', tabName !== 'login');
  registerForm.classList.toggle('hidden', tabName !== 'register');
}

function updateRegisterFields() {
  const role = val('registerRole');
  const isCoach = role === 'Coach';
  document.getElementById('clubNameField').classList.toggle('hidden', !isCoach);
  document.getElementById('clubCodeField').classList.toggle('hidden', isCoach);
}

function register() {
  const first = val('registerFirst');
  const last = val('registerLast');
  const password = document.getElementById('registerPassword').value;
  const role = val('registerRole');

  if (!first || !last || password.length < 6) {
    alert('Prénom, nom et mot de passe de 6 caractères minimum obligatoires.');
    return;
  }

  const username = usernameFrom(first, last);
  if (state.users.some((user) => user.username === username)) {
    alert('Cet identifiant existe déjà.');
    return;
  }

  let club = null;

  if (role === 'Coach') {
    const clubName = val('registerClubName');
    if (!clubName) {
      alert('Le nom du club est obligatoire.');
      return;
    }

    club = {
      id: uid(),
      name: clubName,
      code: 'TEAM-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      active: true
    };

    state.clubs.push(club);
  } else {
    const code = val('registerClubCode').toUpperCase();
    if (!code) {
      alert('Le code du club est obligatoire.');
      return;
    }

    club = state.clubs.find((item) => item.code === code && item.active);
    if (!club) {
      alert('Code du club introuvable.');
      return;
    }
  }

  const user = {
    id: uid(),
    first,
    last,
    username,
    password,
    role,
    clubId: club.id,
    active: true,
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  saveState();
  toast('Compte créé avec succès.');
  switchTab('login');
  document.getElementById('loginUsername').value = username;
}

function login() {
  const username = val('loginUsername').toLowerCase();
  const password = document.getElementById('loginPassword').value;

  const user = state.users.find((entry) => entry.username === username && entry.password === password && entry.active);
  if (!user) {
    alert('Identifiant ou mot de passe incorrect.');
    return;
  }

  const club = state.clubs.find((item) => item.id === user.clubId);
  if (!club || !club.active) {
    alert('Club introuvable ou bloqué.');
    return;
  }

  session.value = user;
  enterApp();
}

function enterApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('headerLogout').classList.remove('hidden');
  document.getElementById('headerUser').textContent = `${currentUser().first} ${currentUser().last}`;
  document.getElementById('welcomeTitle').textContent = `Bonjour ${currentUser().first} ${currentUser().last}`;
  document.getElementById('roleBadge').textContent = currentUser().role;
  document.getElementById('clubSubtitle').textContent = currentClub() ? currentClub().name : 'Club inconnu';
  render();
  openPage('dashboard', document.querySelector('#mainNav button[data-page="dashboard"]'));
}

function logout() {
  session.value = null;
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('headerLogout').classList.add('hidden');
  document.getElementById('headerUser').textContent = '';
  document.getElementById('loginPassword').value = '';
}

function renderDashboard() {
  const club = currentClub();
  const members = state.users.filter((u) => u.clubId === session.value.clubId);
  const messages = state.messages.filter((m) => m.clubId === session.value.clubId);
  const events = state.members.filter((m) => m.clubId === session.value.clubId); // placeholder section

  document.getElementById('statMembers').textContent = String(members.length);
  document.getElementById('statMessages').textContent = String(messages.length);
  document.getElementById('statEvents').textContent = String(events.length || 0);
  document.getElementById('statTeams').textContent = String(club?.teams?.length || 0);

  const content = [
    `<p><b>Club :</b> ${club ? club.name : 'Non défini'}</p>`,
    `<p><b>Code du club :</b> ${club ? club.code : 'Non défini'}</p>`,
    `<p><b>Rôle :</b> ${session.value.role}</p>`
  ].join('');

  document.getElementById('dashboardContent').innerHTML = content;
}

function renderMessages() {
  const list = state.messages.filter((m) => m.clubId === session.value.clubId).sort((a, b) => b.date.localeCompare(a.date));
  const html = list.length
    ? list.map((m) => `
      <div class="item">
        <div class="row">
          <b>${m.author}</b>
          <span class="small">${new Date(m.date).toLocaleString('fr-FR')}</span>
        </div>
        <p>${m.text}</p>
      </div>`).join('')
    : '<div class="empty">Aucun message pour le moment.</div>';

  document.getElementById('messagesList').innerHTML = html;
}

function sendMessage() {
  const text = val('messageInput');
  if (!text) return;

  state.messages.push({
    id: uid(),
    clubId: session.value.clubId,
    author: `${session.value.first} ${session.value.last}`,
    text,
    date: new Date().toISOString()
  });

  document.getElementById('messageInput').value = '';
  saveState();
  renderMessages();
  toast('Message envoyé.');
}

function renderNews() {
  const clubNews = state.news.filter((n) => n.clubId === session.value.clubId).sort((a, b) => b.date.localeCompare(a.date));
  const canManage = session.value.role === 'Coach';
  const create = document.getElementById('newsCreate');
  create.classList.toggle('hidden', !canManage);

  const html = clubNews.length
    ? clubNews.map((n) => `
      <div class="item">
        <div class="row">
          <b>${n.title}</b>
          <span class="small">${new Date(n.date).toLocaleString('fr-FR')}</span>
        </div>
        <p>${n.text}</p>
        <span class="small">Publié par ${n.author}</span>
      </div>`).join('')
    : '<div class="empty">Aucune actualité publiée.</div>';

  document.getElementById('newsList').innerHTML = html;
}

function publishNews() {
  const title = val('newsTitle');
  const text = val('newsText');
  if (!title || !text) {
    alert('Titre et contenu obligatoires.');
    return;
  }

  state.news.push({
    id: uid(),
    clubId: session.value.clubId,
    title,
    text,
    author: `${session.value.first} ${session.value.last}`,
    date: new Date().toISOString()
  });

  document.getElementById('newsTitle').value = '';
  document.getElementById('newsText').value = '';
  saveState();
  renderNews();
  toast('Actualité publiée.');
}

function renderCalendar() {
  const events = [
    { title: 'Entraînement U15', date: new Date(Date.now() + 86400000).toISOString(), type: 'Entraînement' },
    { title: 'Réunion staff', date: new Date(Date.now() + 172800000).toISOString(), type: 'Réunion' },
    { title: 'Match à domicile', date: new Date(Date.now() + 259200000).toISOString(), type: 'Match' }
  ];

  const html = events.map((event) => `
    <div class="item">
      <div class="row">
        <b>${event.title}</b>
        <span class="badge badge-orange">${event.type}</span>
      </div>
      <p class="small">${new Date(event.date).toLocaleString('fr-FR')}</p>
    </div>`).join('');

  document.getElementById('calendarContent').innerHTML = html || '<div class="empty">Aucun événement programmé.</div>';
}

function renderMembers() {
  const search = (document.getElementById('memberSearch') || {}).value || '';
  const users = state.users.filter((u) => u.clubId === session.value.clubId && `${u.first} ${u.last} ${u.role}`.toLowerCase().includes(search.toLowerCase()));

  document.getElementById('membersList').innerHTML = users.length
    ? users.map((u) => `
      <div class="member-line item">
        <div class="member-info">
          <div class="avatar">${u.first.charAt(0).toUpperCase()}</div>
          <div>
            <b>${u.first} ${u.last}</b>
            <small>${u.role} • ${u.username}</small>
          </div>
        </div>
      </div>`).join('')
    : '<div class="empty">Aucun membre trouvé.</div>';
}

function renderAccount() {
  const user = currentUser();
  const club = currentClub();
  document.getElementById('accountContent').innerHTML = `
    <p><b>Nom :</b> ${user.first} ${user.last}</p>
    <p><b>Identifiant :</b> ${user.username}</p>
    <p><b>Rôle :</b> ${user.role}</p>
    <p><b>Club :</b> ${club ? club.name : 'Non défini'}</p>
    <p><b>Inscription :</b> ${new Date(user.createdAt).toLocaleString('fr-FR')}</p>
  `;
}

function render() {
  if (!session.value) return;

  renderDashboard();
  renderMessages();
  renderNews();
  renderCalendar();
  renderMembers();
  renderAccount();
}

function requestPasswordReset() {
  const username = val('forgotUsername').toLowerCase();
  const first = val('forgotFirst');
  const last = val('forgotLast');

  if (!username || !first || !last) {
    alert('Renseignez votre identifiant, prénom et nom.');
    return;
  }

  const user = state.users.find((entry) => entry.username === username && entry.first.toLowerCase() === first.toLowerCase() && entry.last.toLowerCase() === last.toLowerCase());
  if (!user) {
    alert('Compte introuvable.');
    return;
  }

  if (!state.resetRequests.some((req) => req.userId === user.id && req.status === 'pending')) {
    state.resetRequests.push({
      id: uid(),
      userId: user.id,
      username: user.username,
      first: user.first,
      last: user.last,
      clubId: user.clubId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    saveState();
  }

  toast('Demande enregistrée. Un coach ou un administrateur la validera.');
  document.getElementById('forgotPasswordPanel').classList.add('hidden');
}

function togglePasswordVisibility(id, button) {
  const input = document.getElementById(id);
  if (!input) return;
  const shouldShow = input.type === 'password';
  input.type = shouldShow ? 'text' : 'password';
  button.textContent = shouldShow ? 'Masquer' : 'Afficher';
}

function seedDemoData() {
  if (state.users.length || state.clubs.length) return;

  const club = {
    id: uid(),
    name: 'FC Saint-Étienne Junior',
    code: 'TEAM-ALPHA',
    active: true
  };

  const coach = {
    id: uid(),
    first: 'Lorenzo',
    last: 'Dutour',
    username: 'lorenzo.dutour',
    password: 'secret123',
    role: 'Coach',
    clubId: club.id,
    active: true,
    createdAt: new Date().toISOString()
  };

  const player = {
    id: uid(),
    first: 'Lucas',
    last: 'Martin',
    username: 'lucas.martin',
    password: 'secret123',
    role: 'Joueur',
    clubId: club.id,
    active: true,
    createdAt: new Date().toISOString()
  };

  state.clubs.push(club);
  state.users.push(coach, player);
  state.messages.push({
    id: uid(),
    clubId: club.id,
    author: 'Lorenzo Dutour',
    text: 'Bonjour à tous, entraînement ce mercredi à 18h.',
    date: new Date().toISOString()
  });
  state.news.push({
    id: uid(),
    clubId: club.id,
    title: 'Nouvelle saison',
    text: 'La préparation démarre ce week-end avec les nouveaux équipements.',
    author: 'Lorenzo Dutour',
    date: new Date().toISOString()
  });

  saveState();
}

function attachEvents() {
  document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
  document.getElementById('tabRegister').addEventListener('click', () => switchTab('register'));
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('registerBtn').addEventListener('click', register);
  document.getElementById('headerLogout').addEventListener('click', logout);
  document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
  document.getElementById('publishNewsBtn').addEventListener('click', publishNews);
  document.getElementById('submitResetRequestBtn').addEventListener('click', requestPasswordReset);
  document.getElementById('forgotLink').addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('forgotPasswordPanel').classList.toggle('hidden');
  });
  document.getElementById('registerRole').addEventListener('change', updateRegisterFields);

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => togglePasswordVisibility(button.dataset.togglePassword, button));
  });

  document.querySelectorAll('#mainNav button').forEach((button) => {
    button.addEventListener('click', () => openPage(button.dataset.page, button));
  });

  document.getElementById('memberSearch').addEventListener('input', renderMembers);
}

function init() {
  seedDemoData();
  attachEvents();
  updateRegisterFields();
  switchTab('login');
  render();
}

init();
