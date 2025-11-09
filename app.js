const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>Hello from Node.js!</h1><p>This is a simple Express app running successfully.</p>');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
