const express = require('express');
const path = require('path');
const uuidv4 = require('uuid').v4;
 
const app = express();
const PORT = 7080;

const sessions= {};
app.use(express.json()); // Enable JSON body parsing

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));
// Route to serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Oko', 'index.html'));
});

// Route to handle login logic
app.post('/LoginOko', (req, res) => {
  // Replace this with your actual login logic
  const { usernameOko,passwordOko } = req.body;

  if (usernameOko !== 'admin' || passwordOko !== 'admin') {
    return res.status(401).send('invalid Password');
  } 
  const sessionID = uuidv4();
  sessions[sessionID] = {usernameOko, userID: 1};
  res.set('Set-Cookie', `session=${sessionID}`);
  res.send('success');
  
})

app.post('/LogoutOko', (req, res) => {
  const sessionID = req.headers.cookie?.split('=')[1];
  delete sessions[sessionID];
  res.clearCookie();
  
})


app.get('/Oko/restricted',(req, res) =>{
const sessionID = req.headers.cookie?.split('=')[1];
const userSession = sessions[sessionID];
if(!userSession){
  return res.status(401).send('invalid Session');
}
const userID = userSession.userID;
res.send([{
  id:1,
  title:'lol',
  userID
}]);


})
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
