const express = require('express');
const fs = require('fs');

// Create express app
const app = express();

// Setup static files
app.use(express.static('static'));

// Parse json body
app.use(express.json());

// Update tasks.json
app.post('/tasks', function (req, res) {
    try {
        console.log(req.body);
        const data = req.body;
        if (!data.tasks) return res.sendStatus(400);
        fs.writeFile("static/data/tasks.json", JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

// listen on port 3030
app.listen(3030, () => { console.log("App listening on port 3030!") });