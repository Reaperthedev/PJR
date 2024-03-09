const express = require('express'); // Express.js Framework wird eingebunden
const path = require('path'); // Modul path wird eingebunden, um Pfade zu manipulieren
const uuidv4 = require('uuid').v4; // uuidv4-Funktion wird aus dem uuid-Modul eingebunden
const sqlite3 = require('sqlite3').verbose(); // sqlite3-Modul wird eingebunden, um mit einer SQLite-Datenbank zu arbeiten
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const db = new sqlite3.Database('mos.db');
const upload = multer({ dest: 'uploads/' });
const app = express(); // Eine Express-App wird erstellt
const PORT = 7080; // Der Port, auf dem der Server lauscht, wird festgelegt

const sessions = {}; // Ein Objekt wird erstellt, um Sitzungsdaten zu speichern

app.use(express.json()); // Middleware wird verwendet, um das Parsen von JSON-Anfragen zu ermöglichen
app.use(express.static(path.join(__dirname, 'frontend'))); // Middleware wird verwendet, um statische Dateien im 'frontend'-Verzeichnis zu servieren

// Middleware, um zu überprüfen, ob eine Sitzungscookie existiert
const checkSession = (req, res, next) => {
  const sessionID = req.headers.cookie?.split('=')[1]; // Die Sitzungs-ID wird aus dem Cookie extrahiert
  if (!sessionID || !sessions[sessionID]) { // Wenn keine Sitzungs-ID vorhanden ist oder die Sitzung nicht im Sitzungsobjekt gefunden wird
    return res.redirect('/'); // Der Benutzer wird zur Startseite umgeleitet
  }
  next(); // Andernfalls wird die nächste Middleware aufgerufen
};

// Route, um die Anmeldeseite zu servieren
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'Oko', 'index.html')); // Die Anmeldeseite wird gesendet
});

// Route, um die Anmelde-Logik zu handhaben
app.post('/LoginOko', (req, res) => {
  const { usernameOko, passwordOko } = req.body; // Benutzername und Passwort werden aus dem Anfragekörper extrahiert

  if (usernameOko !== 'admin' || passwordOko !== 'admin') { // Wenn Benutzername oder Passwort nicht übereinstimmen
    return res.status(401).send('Invalid Password'); // Eine Fehlermeldung wird gesendet
  }

  const sessionID = uuidv4(); // Eine neue Sitzungs-ID wird generiert
  sessions[sessionID] = { usernameOko, userID: 1 }; // Die Sitzungsdaten werden im Sitzungsobjekt gespeichert
  res.set('Set-Cookie', `session=${sessionID}`); // Ein Sitzungscookie wird im Antwortheader gesetzt
  res.send('success'); // Eine Erfolgsmeldung wird gesendet
});

// Route, um die Abmelde-Logik zu handhaben
app.post('/LogoutOko', (req, res) => {
  const sessionID = req.headers.cookie?.split('=')[1]; // Die Sitzungs-ID wird aus dem Cookie extrahiert
  delete sessions[sessionID]; // Die Sitzungsdaten werden aus dem Sitzungsobjekt gelöscht
  res.clearCookie('session'); // Das Sitzungscookie wird gelöscht
  res.redirect('/'); // Der Benutzer wird zur Startseite umgeleitet
});

// Geschützte Route, die eine Sitzung erfordert
app.get('/Oko/restricted', checkSession, (req, res) => {
  const sessionID = req.headers.cookie?.split('=')[1]; // Die Sitzungs-ID wird aus dem Cookie extrahiert
  const userID = sessions[sessionID].userID; // Die Benutzer-ID wird aus den Sitzungsdaten abgerufen
  res.send([{ // Eine Antwort wird gesendet
    id: 1,
    title: 'lol',
    userID
  }]);
});

const createJahrgangsTable = () => {
  const sql_j = `   
    CREATE TABLE IF NOT EXISTS ${sanitizeTableName(jahrgangName)} (
      schueler_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nachName varchar(255),
      vorName varchar(255),
      akStuffe varchar(255),
      endStuffe varchar(255),
      wahl_1 varchar(255),
      wahl_2 varchar(255),
      wahl_3 varchar(255),
      wahl_4 varchar(255),
      e_wahl_1 varchar(255),
      e_wahl_2 varchar(255)
    )
  `;
  return db.run(sql_j);
};

const createSportkurseTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS sportkurse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sportkurs TEXT,
      sportkurskuerzel TEXT,
      anzahl_schueler INTEGER,
      sportart TEXT
    )
  `;
  return db.run(sql);
};

// Route to handle CSV file upload
app.post('/uploadCSV', upload.single('csvFile'), (req, res) => {
  const jahrgangName = req.body['jahrgang-name']; // Extract the Jahrgang name from the request

  if (!jahrgangName) {
      return res.status(400).send('Jahrgang name is required.'); // Return an error if Jahrgang name is not provided
  }

  const db = new sqlite3.Database('mos.db');

    const sql_j = `INSERT INTO ${sanitizeTableName(jahrgangName)} (schueler_id, nachName, vorName, akStuffe, endStuffe, wahl_1, wahl_2, wahl_3, wahl_4, e_wahl_1, e_wahl_2) VALUES (?, ?, ?, ?)`;
    db.run(sql_j, [schueler_id, nachName, vorName, akStuffe, endStuffe, wahl_1, wahl_2, wahl_3, wahl_4, e_wahl_1, e_wahl_2], function(err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.send('${sanitizeTableName(jahrgangName)} added successfully.');
    });

/*
  // Open the CSV file and insert data into the database
  fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
          // Insert data into the corresponding table
          db.run(`INSERT INTO ${sanitizeTableName(jahrgangName)} (column1, column2, ...) VALUES (?, ?, ...)`, [row.column1, row.column2], (err) => {
              if (err) {
                  console.error(err.message);
              }
          });
      })
      .on('end', () => {
          // Remove the uploaded CSV file
          fs.unlinkSync(req.file.path);
          // Close the database connection after all data insertion is completed
          db.close((err) => {
              if (err) {
                  return console.error(err.message);
              }
              console.log('Database connection closed.');
          });
          // Respond with success message
          res.send('CSV file uploaded successfully.');
      });
*/
    });

// Function to sanitize table name
function sanitizeTableName(name) {
  // Remove special characters and spaces, and convert to lowercase
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}


// Route to add a new sportkurs
app.post('/addSportkurs', (req, res) => {
  const { sportkurs, sportkurskuerzel, anzahl_schueler, sportart } = req.body;

  const sql = `INSERT INTO sportkurse (sportkurs, sportkurskuerzel, anzahl_schueler, sportart) VALUES (?, ?, ?, ?)`;
  db.run(sql, [sportkurs, sportkurskuerzel, anzahl_schueler, sportart], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send('Sportkurs added successfully.');
  });
});

// Route to get all sportkurse
app.get('/getSportkurse', (req, res) => {
  const sql = `SELECT * FROM sportkurse`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(rows);
  });
});

// Route to update a sportkurs
app.put('/updateSportkurs/:id', (req, res) => {
  const { sportkurs, sportkurskuerzel, anzahl_schueler, sportart } = req.body;
  const id = req.params.id;

  const sql = `UPDATE sportkurse SET sportkurs=?, sportkurskuerzel=?, anzahl_schueler=?, sportart=? WHERE id=?`;
  db.run(sql, [sportkurs, sportkurskuerzel, anzahl_schueler, sportart, id], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send('Sportkurs updated successfully.');
  });
});

// Route to delete a sportkurs
app.delete('/deleteSportkurs/:id', (req, res) => {
  const id = req.params.id;
  const sql = `DELETE FROM sportkurse WHERE id=?`;
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send('Sportkurs deleted successfully.');
  });
});

// Call createSportkurseTable function when setting up the database
createSportkurseTable();

// Call createSportkurseTable function when setting up the database
createJahrgangsTable();




app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`); // Eine Nachricht wird ausgegeben, wenn der Server gestartet wird
});
