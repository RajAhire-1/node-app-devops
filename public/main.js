// main.js
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
scoreVal.innerText = minScore.value;

// helper fallback just in case (different image for variety)
function fallbackImage(title) {
  const keywords = encodeURIComponent(title + ' movie poster');
  return `https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=800&q=80&${keywords}`;
}

async function fetchMovies(params = {}) {
  const q = new URLSearchParams(params);
  const resp = await fetch('/api/movies?' + q.toString());
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.data;
}

function cardTemplate(m) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="thumb">
      <img class="poster-img" src="${m.posterUrl || fallbackImage(m.title)}" alt="${m.title} poster"
           onerror="this.onerror=null;this.src='${fallbackImage(m.title)}'">
    </div>
    <div style="flex:1">
      <h3 style="margin:0;font-size:1rem">${m.title}</h3>
      <div class="meta">
        <span class="tag">${m.genre}</span>
        <span>${m.score} ⭐</span>
      </div>
    </div>
  `;
  div.addEventListener('click', () => openDetails(m.id));
  return div;
}

async function loadAndRender(filters = {}) {
  grid.innerHTML = '<div style="color:var(--muted);">Loading...</div>';
  const movies = await fetchMovies(filters);
  grid.innerHTML = '';
  if (!movies || movies.length === 0) {
    grid.innerHTML = '<div style="color:var(--muted);">No movies found.</div>';
    return;
  }
  movies.forEach(m => grid.appendChild(cardTemplate(m)));
}

minScore.addEventListener('input', () => scoreVal.innerText = minScore.value);

applyBtn.addEventListener('click', () => {
  loadAndRender({
    genre: genreSelect.value,
    minScore: minScore.value
  });
});

searchInput.addEventListener('input', debounce(async (e) => {
  const q = e.target.value.trim();
  if (!q) return loadAndRender(getFilters());
  const all = await fetchMovies();
  const results = all.filter(m => (m.title + ' ' + (m.director||'') + ' ' + (m.tagline||'')).toLowerCase().includes(q.toLowerCase()));
  grid.innerHTML = '';
  results.forEach(m => grid.appendChild(cardTemplate(m)));
}, 250));

function getFilters(){
  const filters = {};
  const g = genreSelect.value;
  if (g) filters.genre = g;
  const min = parseFloat(minScore.value);
  if (min > 0) filters.minScore = min;
  return filters;
}

async function openDetails(id){
  const resp = await fetch(`/api/movies/${id}`);
  if (!resp.ok) return;
  const { data } = await resp.json();

  modalContent.innerHTML = `
    <div style="display:flex;gap:1rem;align-items:flex-start;">
      <img src="${data.posterUrl || fallbackImage(data.title)}" class="modal-poster" alt="${data.title} poster" onerror="this.onerror=null;this.src='${fallbackImage(data.title)}'">
      <div>
        <h2 style="margin:0 0 6px 0">${data.title} <small style="color:var(--muted);font-weight:600">(${data.year})</small></h2>
        <p style="margin-top:6px">${data.tagline || ''}</p>
        <p><strong>Director:</strong> ${data.director || '—'}</p>
        <p><strong>Genre:</strong> ${data.genre} • <strong>Length:</strong> ${data.length} min</p>
        <p><strong>Showtimes:</strong> ${ (data.showtimes || []).join(', ') }</p>
        <div style="margin-top:1rem;display:flex;gap:0.5rem">
          <button class="btn primary" onclick="alert('Pretend booking for ${data.title}')">Book Now</button>
          <button class="btn" onclick="closeModalFn()">Close</button>
        </div>
      </div>
    </div>
  `;
  modal.setAttribute('aria-hidden', 'false');
}

function closeModalFn(){
  modal.setAttribute('aria-hidden', 'true');
}

closeModal.addEventListener('click', closeModalFn);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModalFn(); });

function debounce(fn, ms=200){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };}

// initial load
loadAndRender();
