import express from 'express';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, get, set } from 'firebase/database';

const app = express();
const port = 21323;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware for JSON body parsing
app.use(express.urlencoded({ extended: true }));

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPbJrbz-QBUw8aY2kvZLi-h4rVDDV26_A",
    authDomain: "atcchatpopup.firebaseapp.com",
    databaseURL: "https://atcchatpopup-default-rtdb.firebaseio.com",
    projectId: "atcchatpopup",
    storageBucket: "atcchatpopup.appspot.com",
    messagingSenderId: "495140373446",
    appId: "1:495140373446:web:d127215cab6676793d68c7",
    measurementId: "G-LWLS6C06R2"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// POST request to send message
app.post('/send_message', (req, res) => {
    const { message, username } = req.query; // Get data from query parameters

    const newMessageRef = push(ref(database, 'messages'));
    set(newMessageRef, {
        message,
        username,
        date: new Date().toLocaleString()
    })
    .then(() => res.send({ success: true }))
    .catch((error) => {
        console.error("Error saving message:", error);
        res.status(500).send({ success: false, error: "Failed to send message" });
    });
});


// GET request to load messages
app.get('/load_messages', (req, res) => {
    get(ref(database, 'messages'))
    .then((snapshot) => {
        if (snapshot.exists()) {
            const messages = snapshot.val();
            const messageArray = Object.keys(messages).map(key => ({
                id: key,            // Unique message ID
                ...messages[key]    // Spread each message’s contents
            }));
            res.json(messageArray);  // Send as JSON array
        } else {
            res.json([]);  // Return empty array if no messages found
        }
    })
    .catch((error) => {
        console.error("Error loading messages:", error);
        res.status(500).json({ success: false, error: "Failed to load messages" });
    });
});


app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
