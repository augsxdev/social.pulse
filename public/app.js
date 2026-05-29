const feedEl = document.getElementById('feed');
const storiesRow = document.getElementById('storiesRow');
const aiPanel = document.getElementById('aiPanel');
const postsMetric = document.getElementById('postsMetric');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('composerModal');
const postTemplate = document.getElementById('postTemplate');

const openComposer = document.getElementById('openComposer');
const quickPost = document.getElementById('quickPost');
const closeComposer = document.getElementById('closeComposer');
const fillDemo = document.getElementById('fillDemo');
const postForm = document.getElementById('postForm');
const postContent = document.getElementById('postContent');
const postMedia = document.getElementById('postMedia');
const postMusic = document.getElementById('postMusic');

const activeAvatar = document.getElementById('activeAvatar');
const composerAvatar = document.getElementById('composerAvatar');
const activeName = document.getElementById('activeName');
const activeHandle = document.getElementById('activeHandle');

let state = {
  posts: [],
  users: [],
  aiProfiles: []
};

const currentUserId = 'u1';

function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatRelativeDate(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function getYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(u.hostname)) return null;
    let id = '';
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (u.pathname === '/watch') {
      id = u.searchParams.get('v');
    } else if (u.pathname.startsWith('/shorts/')) {
      id = u.pathname.split('/shorts/')[1].split('/')[0];
    }
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}

function getSpotifyEmbed(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('spotify.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const type = parts[0];
    const id = parts[1];
    return `https://open.spotify.com/embed/${type}/${id}`;
  } catch {
    return null;
  }
}

function getMusicEmbedUrl(url) {
  return getSpotifyEmbed(url) || getYouTubeEmbed(url) || null;
}

function renderStories() {
  const featured = state.users.slice(0, 3);
  storiesRow.innerHTML = featured.map(user => {
    const ai = state.aiProfiles.find(x => x.userId === user.id);
    return `
      <div class="story">
        <div class="story-top">
          <img src="${user.avatar}" alt="${escapeHtml(user.name)}">
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <p>@${escapeHtml(user.username)}</p>
          </div>
        </div>
        <p>${escapeHtml(user.bio)}</p>
        <div class="ai-chip">${escapeHtml(ai?.status || 'IA ativa')}</div>
      </div>
    `;
  }).join('');
}

function renderAiPanel() {
  const user = state.users.find(u => u.id === currentUserId) || state.users[0];
  const ai = state.aiProfiles.find(x => x.userId === user.id);
  aiPanel.innerHTML = `
    <div class="ai-card">
      <strong>${escapeHtml(user.name)}</strong>
      <div class="muted">@${escapeHtml(user.username)}</div>
      <p style="margin-top:10px">${escapeHtml(ai?.personality || 'Sem personalidade definida')}</p>
    </div>
    <div class="ai-card">
      <strong>Prompt</strong>
      <p>${escapeHtml(ai?.prompt || '—')}</p>
    </div>
    <div class="ai-card">
      <strong>Status</strong>
      <p>${escapeHtml(ai?.status || 'Offline')}</p>
    </div>
  `;
}

function renderPost(post) {
  const template = postTemplate.content.cloneNode(true);
  const avatar = template.querySelector('.avatar');
  const name = template.querySelector('.post-name');
  const handle = template.querySelector('.post-handle');
  const time = template.querySelector('.post-time');
  const content = template.querySelector('.post-content');
  const media = template.querySelector('.post-media');
  const music = template.querySelector('.music-embed');
  const commentsList = template.querySelector('.comments-list');
  const commentForm = template.querySelector('.comment-form');
  const commentToggle = template.querySelector('.comment-toggle');
  const likeBtn = template.querySelector('.like-btn');
  const likeCount = template.querySelector('.like-count');

  avatar.src = post.user?.avatar || '';
  name.textContent = post.user?.name || 'Usuário';
  handle.textContent = `@${post.user?.username || 'user'}`;
  time.textContent = formatRelativeDate(post.createdAt);
  content.textContent = post.content;
  likeCount.textContent = post.likes ?? 0;

  if (post.media) {
    media.src = post.media;
  } else {
    media.style.display = 'none';
  }

  const embedUrl = post.musicLink ? getMusicEmbedUrl(post.musicLink) : null;
  if (embedUrl) {
    const isSpotify = embedUrl.includes('open.spotify.com/embed');
    const height = isSpotify ? 152 : 352;
    music.innerHTML = `<iframe src="${embedUrl}" height="${height}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
  } else {
    music.style.display = 'none';
  }

  commentsList.innerHTML = post.comments.map(c => `
    <div class="comment"><strong>${escapeHtml(c.user)}:</strong> ${escapeHtml(c.text)}</div>
  `).join('') || '<div class="comment">Sem comentários ainda.</div>';

  let commentsVisible = true;
  commentToggle.addEventListener('click', () => {
    commentsVisible = !commentsVisible;
    commentForm.style.display = commentsVisible ? 'flex' : 'none';
    commentsList.style.display = commentsVisible ? 'grid' : 'none';
  });

  likeBtn.addEventListener('click', async () => {
    await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    post.likes += 1;
    likeCount.textContent = post.likes;
  });

  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = commentForm.querySelector('input');
    const text = input.value.trim();
    if (!text) return;

    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: 'Você', text })
    });
    const comment = await res.json();
    post.comments.push(comment);
    commentsList.innerHTML = post.comments.map(c => `
      <div class="comment"><strong>${escapeHtml(c.user)}:</strong> ${escapeHtml(c.text)}</div>
    `).join('');
    input.value = '';
  });

  return template;
}

function renderFeed(filter = '') {
  const term = filter.toLowerCase();
  const items = state.posts.filter(post => {
    const userText = `${post.user?.name || ''} ${post.user?.username || ''}`.toLowerCase();
    const contentText = (post.content || '').toLowerCase();
    const musicText = (post.musicLink || '').toLowerCase();
    return !term || userText.includes(term) || contentText.includes(term) || musicText.includes(term);
  });

  feedEl.innerHTML = '';
  items.forEach(post => feedEl.appendChild(renderPost(post)));
  postsMetric.textContent = items.length;
}

async function loadData() {
  const [usersRes, feedRes] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/feed')
  ]);
  state.users = await usersRes.json();
  state.posts = await feedRes.json();
  state.aiProfiles = state.users.map(u => u.aiProfile).filter(Boolean);

  const currentUser = state.users.find(u => u.id === currentUserId) || state.users[0];
  activeAvatar.src = currentUser.avatar;
  composerAvatar.src = currentUser.avatar;
  activeName.textContent = currentUser.name;
  activeHandle.textContent = `@${currentUser.username}`;

  renderStories();
  renderAiPanel();
  renderFeed(searchInput.value);
}

openComposer.addEventListener('click', openModal);
quickPost.addEventListener('click', openModal);
closeComposer.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
fillDemo.addEventListener('click', () => {
  postContent.value = 'A Pulse está ganhando forma. A ideia é unir rede social, IA e música em uma única experiência.';
  postMedia.value = 'https://images.unsplash.com/photo-1520975682071-a35e8b05c55d?auto=format&fit=crop&w=1200&q=80';
  postMusic.value = 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl';
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    userId: currentUserId,
    content: postContent.value.trim(),
    media: postMedia.value.trim(),
    musicLink: postMusic.value.trim()
  };

  if (!payload.content) return;

  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const post = await res.json();
  state.posts.unshift(post);
  closeModal();
  postForm.reset();
  renderFeed(searchInput.value);
  renderStories();
  renderAiPanel();
});

searchInput.addEventListener('input', () => renderFeed(searchInput.value));

loadData().catch(err => {
  console.error(err);
  feedEl.innerHTML = '<div class="glass post">Falha ao carregar a Pulse.</div>';
});
