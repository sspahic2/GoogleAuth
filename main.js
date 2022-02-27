const express = require('express');
const application = express();
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const OAuth2Data = require('./public/google-auth.json');
const path = require('path');
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris;
const port = 3000;
var authenticated = false;

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

application.get('/', (request, response) => {
    response.sendFile(__dirname + "/public/html/basePage.html");
});

application.get('/api/google/user/authenticate', (request, response) => {
    let email = request.query.email;
    if(!authenticated) {
        let url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            response_type: 'code',
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URL
        });
        console.log(`User authentication url is ${url}`);
        response.redirect(url);
    }
    else { // Here we need to set the Token for the user and return it to them
        let gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        gmail.users.labels.list({
            userId: email
        }, (error, res) => {
            if(error) return response.send('The API returned an error ' + error);
            let labels = res.data.labels;

            if(labels.length) {
                console.log(`Labels: `);
                labels.forEach(label => { console.log(`- ${label.name}`)})

            } else {
                console.log("No labels found");
            }

            response.send("Logged in!");
        });
    }
});

application.get('/api/google/user/login', function(request, response) {
    const responseCode = request.query.code;

    if(responseCode) {
        oAuth2Client.getToken(responseCode, function(error, tokens) {
            if(error) {
                console.log("Unsuccessfull login attempt!");
                response.redirect('/');
                return;
            }

            console.log("Successfully authenticated!");
            oAuth2Client.setCredentials(tokens);
            authenticated = true;
            response.redirect('/api/google/user/authenticate');
        });
    }
});

application.get('/api/data', (request, response) => {
    let data = `{ "something": "Some data here" }`;
    response.send(data);
});

application.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});