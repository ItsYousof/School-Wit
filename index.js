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


app.post('/send_message', async (req, res) => {
    const { sender, recipient, text } = req.body;
    const chatNames = [sender, recipient].sort().join('_');
    const messagesRef = ref(db, `conversations/${chatNames}`);
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, { sender, text, timestamp: Date.now() });
    res.sendStatus(200);
});


app.get('/messages/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    const messages = await loadMessages(user1, user2);
    res.json(messages);
});

function sendMessageToConversation(user1, user2, text) {
    // Create a conversation ID by sorting usernames to ensure uniqueness
    const conversationId = [user1, user2].sort().join('_');
    const messagesRef = ref(db, `conversations/${conversationId}`);
    const newMessageRef = push(messagesRef);
    set(newMessageRef, {
        sender: user1,
        text: text,
        timestamp: Date.now()
    });
}

async function loadMessages(user1, user2) {
    const conversationId = [user1, user2].sort().join('_');
    const messagesRef = ref(db, `conversations/${conversationId}`);
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
        username: username,
        nitro: false
    });
}


// Add nitro value to all users 

function addNitroToAllUsers() {
    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const newUserRef = childSnapshot.ref;
            set(newUserRef, {
                username: user.username,
                nitro: false
            });
        });
    });
}

function postTweet(username, text) {
    const firstWord = text.split(' ')[0];
    const sanitizedFirstWord = firstWord.replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now();
    const tweetId = `${sanitizedFirstWord}_${timestamp}`;

    // Count words in the tweet
    const wordCount = text.split(' ').length;

    // Define an array of bad words
    const badWords = ['ass', 'bitch', 'fuck', 'shit', 'nigger', 'nigga', 'cunt', 'diddy', 'dick']; // Add your bad words here

    // Replace bad words with '*'
    const sanitizedText = badWords.reduce((currentText, badWord) => {
        const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
        return currentText.replace(regex, '*');
    }, text);

    const userRef = ref(db, 'users/' + username);

    // Check if the user has nitro
    get(userRef)
        .then((snapshot) => {
            const user = snapshot.val();
            if (user && user.nitro) {
                // If user has nitro, allow more than 15 words
                if (wordCount > 15) {
                    alert("You can exceed the word limit since you have Nitro!");
                }

                // Post the tweet regardless of the word count
                const tweetRef = ref(db, 'tweets/' + tweetId);
                return set(tweetRef, {
                    username: username,
                    text: sanitizedText,
                    date: timestamp,
                    likes: 0,
                    hearts: 0
                });
            } else {
                // For users without nitro, check word limit
                if (wordCount > 15) {
                    alert("Your tweet exceeds the 15-word limit!");
                    return; // Stop execution
                }

                // Post the tweet with the sanitized text
                const tweetRef = ref(db, 'tweets/' + tweetId);
                return set(tweetRef, {
                    username: username,
                    text: sanitizedText,
                    date: timestamp,
                    likes: 0,
                    hearts: 0
                });
            }
        })
        .catch((error) => {
            console.error("Error fetching user data: ", error);
        });
}
 
app.get('/get_user_rank', (req, res) => {
    const username = req.query.username; // Get the username from query parameters

    const userdb = ref(db, 'users/' + username);
    get(userdb).then((snapshot) => {
        const user = snapshot.val();
        if (user && user.nitro == true) {
            res.send({ rank: true });
        } else {
            if (user && user.nitro == false) { 
                res.send({ rank: false });
            }
        }
    })
});

async function getUserRank(username) { // Changed 'user' to 'username' for clarity
    const userRef = ref(db, 'users/' + username);
    const snapshot = await get(userRef);
    const user = snapshot.val();
    return user && user.nitro === true; // Return true if nitro is true
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
