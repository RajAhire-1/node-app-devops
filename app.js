// app.js
const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Movie data ---
const movies = [
  { id: 101, title: "CineWave", genre: "Drama", length: 112, score: 7.4, lang: "Hindi", year: 2023, color: "#5063f0", tagline: "When waves meet hearts", director: "A. Rao"},
  { id: 102, title: "Night Circuit", genre: "Sci-Fi", length: 129, score: 8.1, lang: "English", year: 2024, color: "#ff8a65", tagline: "City never sleeps", director: "M. Sen"},
  { id: 103, title: "The Lost Kite", genre: "Family", length: 95, score: 7.9, lang: "Hindi", year: 2022, color: "#66bb6a", tagline: "Small joys, big skies", director: "R. Kapoor"},
  { id: 104, title: "Echo Chamber", genre: "Thriller", length: 140, score: 8.6, lang: "English", year: 2024, color: "#ab47bc", tagline: "Every secret echoes", director: "S. Iyer"},
  { id: 105, title: "Spice Route", genre: "Adventure", length: 121, score: 7.8, lang: "Malayalam", year: 2021, color: "#ffca28", tagline: "Sail beyond maps", director: "P. Das"},
];

// --- Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/movies', (req, res) => {
  const { genre, minScore } = req.query;
  let list = movies.slice();
  if (genre) list = list.filter(m => m.genre.toLowerCase() === genre.toLowerCase());
  if (minScore) list = list.filter(m => m.score >= parseFloat(minScore));
  res.json({ success: true, count: list.length, data: list });
});

app.get('/api/movies/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const movie = movies.find(m => m.id === id);
  if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
  movie.showtimes = ["10:00", "13:30", "16:45", "20:00"];
  res.json({ success: true, data: movie });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'CineLite API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

module.exports = app;
