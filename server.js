const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('dist'))

// sendFile will go here
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'dist/html/index.html'));
});

app.get('/error', function(req, res) {
  res.sendFile(path.join(__dirname, 'dist/html/error.html'));
});

app.listen(port);
console.log(`Server started at http://localhost:${port}`);
