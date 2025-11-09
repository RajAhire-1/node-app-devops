const grid = document.getElementById('movieGrid');
const searchInput = document.getElementById('search');
const genreSelect = document.getElementById('genreSelect');
const minScore = document.getElementById('minScore');
const scoreVal = document.getElementById('scoreVal');
const applyBtn = document.getElementById('applyFilters');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');

document.getElementById('year').innerText = new Date().getFullYear();

minScore.addEventListener('input', () => scoreVal.textContent = minScore.value);

async function fetchMovies(params = {}) {
  const q = new URLSearchParams(params);
  const res = await fetch('/api/movies?' + q.toString());
  return (await res.json()).data;
}

function cardTemplate(m) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="thumb" style="background:${m.color}">${m.title}</div>
    <div class="meta">
      <span class="tag">${m.genre}</span>
      <span>${m.score}⭐</span>
    </div>`;
  div.onclick = () => openMovie(m.id);
  return div;
}

async function loadMovies(filters = {}) {
  grid.innerHTML = '<p style="color:gray;">Loading...</p>';
  const list = await fetchMovies(filters);
  grid.innerHTML = '';
  if (!list.length) return grid.innerHTML = '<p>No movies found.</p>';
  list.forEach(m => grid.appendChild(cardTemplate(m)));
}

applyBtn.addEventListener('click', () => {
  loadMovies({
    genre: genreSelect.value,
    minScore: minScore.value
  });
});

searchInput.addEventListener('input', debounce(async e => {
  const q = e.target.value.trim().toLowerCase();
  const all = await fetchMovies();
  const results = all.filter(m => m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q));
  grid.innerHTML = '';
  results.forEach(m => grid.appendChild(cardTemplate(m)));
}, 300));

async function openMovie(id) {
  const res = await fetch('/api/movies/' + id);
  const { data } = await res.json();
  modalContent.innerHTML = `
    <h2>${data.title}</h2>
    <p><strong>Director:</strong> ${data.director}</p>
    <p><strong>Genre:</strong> ${data.genre}</p>
    <p><strong>Length:</strong> ${data.length} min</p>
    <p><strong>Showtimes:</strong> ${data.showtimes.join(', ')}</p>
    <button class="btn primary" onclick="alert('Booking ${data.title}')">Book Now</button>
  `;
  modal.setAttribute('aria-hidden', 'false');
}
closeModal.onclick = () => modal.setAttribute('aria-hidden', 'true');
modal.addEventListener('click', e => { if (e.target === modal) modal.setAttribute('aria-hidden', 'true'); });

function debounce(fn, ms = 200) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

loadMovies();
