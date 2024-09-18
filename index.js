import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, get } from 'firebase/database';
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
    const tweetsRef = ref(db, 'tweets');
    const newTweetRef = push(tweetsRef);
    set(newTweetRef, {
        username: username,
        text: text,
        date: Date.now(),
        likes: 0,
        hearts: 0
    });
}

// Middleware to serve static files
app.use(express.static(path.join(__dirname, filePath)));

app.listen(4213, () => {
    console.log('Server is running on port http://localhost:4213');
});
