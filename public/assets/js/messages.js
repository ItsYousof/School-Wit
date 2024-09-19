document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('username') === null) {
        let username = prompt('What is your name?');
        if (username) {
            localStorage.setItem('username', username);
            document.getElementById('user').innerHTML = username;
            document.getElementById('title').innerHTML = '@' + username;
            addUser(username);
        } else {
            alert('Please enter a username');
            window.location.reload();
        }
    } else {
        const storedUsername = localStorage.getItem('username');
        document.getElementById('user').innerHTML = storedUsername;
        document.getElementById('title').innerHTML = '@' + storedUsername;
    }

    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

let selectedUser = null; // Track the selected user
const currentUser = localStorage.getItem('username'); // Get the current logged-in user's username

async function loadUsers() {
    const response = await fetch('/users');
    const users = await response.json();
    const usersContainer = document.getElementById('usersContainer');
    usersContainer.innerHTML = ''; // Clear existing users

    for (const user of users) {
        if (user.username !== currentUser) { // Exclude current user from the list
            addSideUser(user.username);
        }
    }
}

function addSideUser(username) {
    let user = document.createElement('div');
    user.classList.add('user');
    user.innerHTML = `
        <img class="user-avatar" src="assets/images/user-avater.png" alt="user avatar">
        <p>@${username}</p>
    `;

    document.getElementById('usersContainer').appendChild(user);

    user.addEventListener('click', () => {
        document.getElementById('user-name').innerHTML = `Messaging, @${username}`;
        selectedUser = username;
        loadMessages(currentUser, username); // Load messages between current user and selected user
        startPolling(currentUser, username);
    });
}

async function loadMessages(user1, user2) {
    try {
        const chatNames = [user1, user2].sort().join('_');
        const response = await fetch(`/messages/${chatNames}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const messages = await response.json();
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = ''; // Clear old messages

        for (const message of messages) {
            let messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.textContent = `${message.sender}: ${message.text}`;
            messagesContainer.appendChild(messageElement);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (messageText === '' || !selectedUser) return;

    const sender = currentUser; // Get the sender from localStorage

    // Send message to server
    await fetch('/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, recipient: selectedUser, text: messageText })
    });

    messageInput.value = ''; // Clear input field
    loadMessages(sender, selectedUser); // Reload messages to include the new one
}

function startPolling(user1, user2) {
    const chatNames = [user1, user2].sort().join('_');

    setInterval(async () => {
        const response = await fetch(`/messages/${chatNames}`);
        if (!response.ok) {
            console.error('Error fetching messages:', response.statusText);
            return;
        }
        const messages = await response.json();
        
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.textContent = `${message.sender}: ${message.text}`;
            messagesContainer.appendChild(messageElement);
        });
    }, 3000); // Poll every 3 seconds
}
