const express = require('express'); // Express.js Framework wird eingebunden
const path = require('path'); // Modul path wird eingebunden, um Pfade zu manipulieren
const uuidv4 = require('uuid').v4; // uuidv4-Funktion wird aus dem uuid-Modul eingebunden
const sqlite3 = require('sqlite3').verbose(); // sqlite3-Modul wird eingebunden, um mit einer SQLite-Datenbank zu arbeiten
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');


const db = new sqlite3.Database('mos.db');
// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Create the multer instance
const upload = multer({storage: storage});
const app = express(); // Eine Express-App wird erstellt
const PORT = 7080; // Der Port, auf dem der Server lauscht, wird festgelegt

const sessions = {}; // Ein Objekt wird erstellt, um Sitzungsdaten zu speichern

app.use(cors());
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

function login_shueler(pin) {
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'jahrgang_%'", [], (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                let promises = [];
                rows.forEach((row) => {
                    const query = `SELECT * FROM ${row.name} WHERE pin = ?`;
                    promises.push(
                        new Promise((resolveQuery, rejectQuery) => {
                            db.all(query, [pin], (err, rows) => {
                                if (err) {
                                    console.error(err.message);
                                    rejectQuery(err);
                                } else if (rows.length > 0) {
                                    resolveQuery(rows[0].uuid);
                                } else {
                                    resolveQuery(null); // Indicate user not found
                                }
                            });
                        })
                    );
                });
                Promise.all(promises)
                    .then(uuids => {
                        const foundUuid = uuids.find(uuid => uuid !== null);
                        if (foundUuid) {
                            resolve(foundUuid); // User found
                        } else {
                            reject(new Error("User not found"));
                        }
                    })
                    .catch(error => {
                        reject(error); // Reject if any error occurs during the queries
                    });
            }
        });
    });
}


// Route, um die Anmeldeseite zu servieren
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'Oko', 'index.html')); // Die Anmeldeseite wird gesendet
});

// Route, um die Anmelde-Logik zu handhaben
app.post('/LoginOko', (req, res) => {
    const {usernameOko, passwordOko} = req.body; // Benutzername und Passwort werden aus dem Anfragekörper extrahiert

    if (usernameOko !== 'admin' || passwordOko !== 'admin') { // Wenn Benutzername oder Passwort nicht übereinstimmen
        return res.status(401).send('Invalid Password'); // Eine Fehlermeldung wird gesendet
    }

    const sessionID = uuidv4(); // Eine neue Sitzungs-ID wird generiert
    sessions[sessionID] = {usernameOko, userID: 1}; // Die Sitzungsdaten werden im Sitzungsobjekt gespeichert
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
        id: 1, title: 'lol', userID
    }]);
});


// Route to handle CSV file upload
app.post('/uploadCSV', upload.single('csvFile'), (req, res) => {
    let jahrgangName = req.body['jahrgang-name']; // Extract the Jahrgang name from the request
    /*
        if (!jahrgangName) {
            return res.status(400).send('Jahrgang name is required.'); // Return an error if Jahrgang name is not provided
        }

        const db = new sqlite3.Database('mos.db');

        const sql_j = `INSERT INTO ${sanitizeTableName(jahrgangName)} (schueler_id, nachName, vorName, akStuffe, endStuffe, wahl_1, wahl_2, wahl_3, wahl_4, e_wahl_1, e_wahl_2) VALUES (?, ?, ?, ?)`;
        db.run(sql_j, [schueler_id, nachName, vorName, akStuffe, endStuffe, wahl_1, wahl_2, wahl_3, wahl_4, e_wahl_1, e_wahl_2], function (err) {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.send('${sanitizeTableName(jahrgangName)} added successfully.');
        });
    */

    jahrgangName = sanitizeTableName(jahrgangName);

    createJahrgangsTable(jahrgangName);


    // Open the CSV file and insert data into the database
    fs.createReadStream(req.file.path, 'utf8')
        .pipe(csv())
        .on('data', (row) => {
            console.log(row);
            const blub = row['S-ID;Name;Vorname;Klasse;Stufe'].split(';');
            console.log(blub);

            const sql_j = `INSERT INTO jahrgang_${sanitizeTableName(jahrgangName)} (uuid, schueler_id, nachName, vorName, pin, akStuffe, endStuffe, wahl_1, wahl_2, wahl_3, wahl_4, e_wahl_1, e_wahl_2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(sql_j, [uuidv4(), blub[0], blub[1], blub[2], "1234567", blub[3], blub[4], null, null, null, null, null, null], function (err) {
                if (err) {
                    console.log(err);
                    //return res.status(500).send(err.message);
                }
                //res.send('{jahrgangName} added successfully.');
            });

        })
        .on('end', () => {
            // Remove the uploaded CSV file
            fs.unlinkSync(req.file.path);
            // Close the database connection after all data insertion is completed
            /*db.close((err) => {
              if (err) {
                return console.error(err.message);
              }
              console.log('Database connection closed.');
            });*/
            // Respond with success message
            res.send('CSV file uploaded successfully.');
        });
});

const createJahrgangsTable = (jahrgangName) => {
    const sql_j = `   
    CREATE TABLE IF NOT EXISTS jahrgang_${jahrgangName} (
        uuid varchar(255) PRIMARY KEY,
      schueler_id INTEGER,
      nachName varchar(255),
      vorName varchar(255),
      pin varchar(255),
      akStuffe varchar(255),
      endStuffe varchar(255),
      wahl_1 varchar(255) NULL,
      wahl_2 varchar(255) NULL,
      wahl_3 varchar(255) NULL,
      wahl_4 varchar(255) NULL,
      e_wahl_1 varchar(255) NULL,
      e_wahl_2 varchar(255) NULL
    )
  `;
    return db.run(sql_j);
};

// Function to sanitize table name
function sanitizeTableName(name) {
    // Remove special characters and spaces, and convert to lowercase
    return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}


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

// Route to add a new sportkurs
app.post('/addSportkurs', (req, res) => {
    const {sportkurs, sportkurskuerzel, anzahl_schueler, sportart} = req.body;

    const sql = `INSERT INTO sportkurse (sportkurs, sportkurskuerzel, anzahl_schueler, sportart) VALUES (?, ?, ?, ?)`;
    db.run(sql, [sportkurs, sportkurskuerzel, anzahl_schueler, sportart], function (err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send('Sportkurs added successfully.');
    });
});

app.get('/eintragen', (req, res) => {
    const uuid = req.query.user;
    const wahl1 = req.query.wahl1;
    const wahl2 = req.query.wahl2;
    const wahl3 = req.query.wahl3;
    const wahl4 = req.query.wahl4;
    const wahl5 = req.query.wahl5;
    const wahl6 = req.query.wahl6;

    if (!uuid) {
        return res.status(400).send("user parameter is missing");
    }

    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'jahrgang_%'", [], (err, rows) => {
        if (err) {
            console.error(err.message);
        } else {
            rows.forEach((row) => {
                const query = `SELECT * FROM ${row.name} WHERE uuid = ?`;
                db.all(query, [uuid], (err, rows) => {
                    if (err) {
                        console.error(err.message);

                    } else if (rows.length > 0) {
                        console.log("LALALA")
                        console.log(rows);
                        console.log(row.name);
                        const sql_j = `UPDATE ${row.name} SET wahl_1=?, wahl_2=?, wahl_3=?, wahl_4=?, e_wahl_1=?, e_wahl_2=? WHERE uuid=?`;
                        db.run(sql_j, [wahl1, wahl2, wahl3, wahl4, wahl5, wahl6], function (err) {
                            if (err) {
                                console.log(err);
                                //return res.status(500).send(err.message);
                            }
                            //res.send('{jahrgangName} added successfully.');
                        });
                        db.close();
                        console.log("CLOSED");
                    } else {
                        console.log("NO USER") // Indicate user not found
                        // Warum du werden ausgeführt? Keine Ahnung
                    }
                });
            })

        }
    })
})


app.get('/login_schueler', (req, res) => {
    const pin = req.query.pin;
    let uuid;

    if (!pin) {
        return res.status(400).send("Pin parameter is missing");
    }

    login_shueler(pin)
        .then(uuid => {
            return res.status(200).send(uuid);
        })
        .catch(error => {
            console.error("Error:", error.message);
            return res.status(403).send("Incorrect password");
        });
})

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
    const {sportkurs, sportkurskuerzel, anzahl_schueler, sportart} = req.body;
    const id = req.params.id;

    const sql = `UPDATE sportkurse SET sportkurs=?, sportkurskuerzel=?, anzahl_schueler=?, sportart=? WHERE id=?`;
    db.run(sql, [sportkurs, sportkurskuerzel, anzahl_schueler, sportart, id], function (err) {
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
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send('Sportkurs deleted successfully.');
    });
});

// Call createSportkurseTable function when setting up the database
createSportkurseTable();


app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`); // Eine Nachricht wird ausgegeben, wenn der Server gestartet wird
});