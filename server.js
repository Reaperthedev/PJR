const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 7080;

// Use cookie-parser middleware to handle cookies
app.use(cookieParser());
app.use(express.json()); // Enable JSON body parsing

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Dummy user credentials for illustration purposes
const validUser = {
  username: 'exampleUser',
  password: 'examplePassword',
};

// Middleware to check if the user has a valid session before accessing protected pages
const authenticateUser = (req, res, next) => {
  const userToken = req.cookies.userToken;

  // Check if the user has a valid session
  if (userToken && isValidUserToken(userToken)) {
    return next();
  } else {
    // Redirect to the login page if the session cookie is missing or invalid
    return res.redirect('/frontend/index.html');
  }
};

// Function to validate the userToken (you should implement this based on your needs)
const isValidUserToken = (userToken) => {
  // Add your validation logic here
  // For example, check if the token is not expired or matches a valid user session
  return true; // Placeholder, replace with your actual validation logic
};

// Middleware to check if the user has a valid session on every request
app.use((req, res, next) => {
  // Check if the user has a valid session
  const userToken = req.cookies.userToken;

  if (!userToken && req.path !== '/frontend/index.html') {
    // Redirect to the login page if the session cookie is missing and the request is not for the login page
    return res.redirect('/frontend/index.html');
  }

  // Continue to the next middleware or route handler
  next();
});

// Route to serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Oko', 'index.html'));
});

// Route to handle login logic
app.post('/login', (req, res) => {
  // Replace this with your actual login logic
  const { password } = req.body;

  if (password === validUser.password) {
    // Set a cookie with a one-hour expiration time (in milliseconds)
    const oneHour = 60 * 60 * 1000;
    res.cookie('userToken', 'yourTokenValue', { maxAge: oneHour, httpOnly: true });

    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});


// Protected route example
app.get('/restricted', authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Oko', 'restricted'));
});

// You can add more routes for other restricted files in the 'restricted' directory as needed

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
