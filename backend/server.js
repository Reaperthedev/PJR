    // Import the 'express' module
    const express = require('express');
    const path = require('path');

    const app = express();
    const port = 3045;

    // Serve static files from the Frontend-folder
    app.use(express.static('./frontend/'));
    // Start the server and listen on the specified port
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
