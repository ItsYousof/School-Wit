import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, get, update } from 'firebase/database';
import bodyParser from 'body-parser';  // Add this import
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import multer from 'multer';
const multerStorage = multer.memoryStorage();
import dotenv from 'dotenv';
dotenv.config();


const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const storage = getStorage(firebaseApp);
const upload = multer({ storage: storage });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = 'public'; // No leading slash needed

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

app.post('/tweet', (req, res) => {
    const { username, text } = req.body;
    postTweet(username, text);
    res.sendStatus(200);
});

app.get('/tweets', async (req, res) => {
    const tweets = await loadTweets();
    res.json(tweets);
});

app.get('/users', async (req, res) => { 
    const users = await loadUsers();
    res.json(users);
});

// Store and load messages
app.post('/send_message', (req, res) => {
    const { sender, recipient, text } = req.body;
    sendMessageToUser(sender, recipient, text);
    res.sendStatus(200);
});

app.get('/messages/:username', async (req, res) => {
    const username = req.params.username;
    const messages = await loadMessages(username);
    res.json(messages);
});

function sendMessageToUser(sender, recipient, text) {
    const messagesRef = ref(db, `messages/${recipient}`);
    const newMessageRef = push(messagesRef);
    set(newMessageRef, {
        sender: sender,
        text: text,
        timestamp: Date.now()
    });
}

async function loadMessages(username) {
    const messagesRef = ref(db, `messages/${username}`);
    const snapshot = await get(messagesRef);
    const messages = [];
    snapshot.forEach((childSnapshot) => {
        messages.push(childSnapshot.val());
    });
    return messages;
}


async function loadUsers() {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = [];
    snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        users.push(user);
    });
    return users;
}


async function loadTweets() {
    const tweetsRef = ref(db, 'tweets');
    const snapshot = await get(tweetsRef);
    const tweets = [];
    snapshot.forEach((childSnapshot) => {
        const tweet = childSnapshot.val();
        tweets.push(tweet);
    });
    return tweets;
}

app.post('/add_user', (req, res) => { 
    const { username } = req.body;
    addUser(username);
    res.sendStatus(200);
})

function addUser(username) {
    const usersRef = ref(db, 'users');
    // Naming the user in the database and setting the ref to it too
    const newUserRef = push(usersRef);
    set(newUserRef, {
        username: username
    });
}


function postTweet(username, text) {
    // Get the first word of the tweet
    const firstWord = text.split(' ')[0];
    const sanitizedFirstWord = firstWord.replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters
    const timestamp = Date.now(); // To ensure uniqueness
    const tweetId = `${sanitizedFirstWord}_${timestamp}`; // Create a unique key

    const tweetRef = ref(db, 'tweets/' + tweetId);

    set(tweetRef, {
        username: username,
        text: text,
        date: timestamp,
        likes: 0,
        hearts: 0
    });
}


// Middleware to serve static files
app.use(express.static(path.join(__dirname, filePath)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, filePath, 'index.html'));
});


app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, filePath, 'messages.html'));
});

app.listen(5000, () => {
    console.log('Server is running on port http://localhost:5000');
});
