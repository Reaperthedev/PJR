const express = require('express');
const path = require('path');
const uuidv4 = require('uuid').v4;
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 7080;

const sessions = {};

app.use(express.json()); // Enable JSON body parsing
app.use(express.static(path.join(__dirname, 'frontend')));

// Middleware to check if session cookie exists
const checkSession = (req, res, next) => {
  const sessionID = req.headers.cookie?.split('=')[1];
  if (!sessionID || !sessions[sessionID]) {
    return res.redirect('/');
  }
  next();
};

// Route to serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Oko', 'index.html'));
});

// Route to handle login logic
app.post('/LoginOko', (req, res) => {
  const { usernameOko, passwordOko } = req.body;

  if (usernameOko !== 'admin' || passwordOko !== 'admin') {
    return res.status(401).send('Invalid Password');
  }

  const sessionID = uuidv4();
  sessions[sessionID] = { usernameOko, userID: 1 };
  res.set('Set-Cookie', `session=${sessionID}`);
  res.send('success');
});

// Route to handle logout logic
app.post('/LogoutOko', (req, res) => {
  const sessionID = req.headers.cookie?.split('=')[1];
  delete sessions[sessionID];
  res.clearCookie('session');
  res.redirect('/');
});

// Restricted route requiring session
app.get('/Oko/restricted', checkSession, (req, res) => {
  const sessionID = req.headers.cookie?.split('=')[1];
  const userID = sessions[sessionID].userID;
  res.send([{
    id: 1,
    title: 'lol',
    userID
  }]);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
