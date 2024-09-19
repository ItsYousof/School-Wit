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
    document.getElementById('user').innerHTML = localStorage.getItem('username');
    document.getElementById('title').innerHTML = '@' + localStorage.getItem('username');
}

let selectedUser = null; // Keep track of the selected user
const currentUser = localStorage.getItem('username'); // Get the current logged-in user's username

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

async function loadUsers() { 
    const response = await fetch('/users');
    const users = await response.json();
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
        loadMessages(currentUser, username); // Load messages between current user and 

        // Start interval to load messages every 5 seconds
        setInterval(() => {
            loadMessages(currentUser, username);
        }, 5000);

        // If the user clicks on another user, stop the interval
        if (selectedUser) {
            clearInterval();
        }

        selectedUser = username;
    });
}
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
async function loadMessages(user1, user2) {
    try {
        const response = await fetch(`/messages/${user1}/${user2}`);
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
        
        scrollToBottom(); // Scroll to the bottom after messages are loaded
    } catch (error) {
        console.error('Error loading messages:', error);
        // Handle errors such as showing a message to the user
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value;

    if (messageText.trim() === '' || !selectedUser) return;

    const sender = currentUser; // Get the sender from localStorage

    // Send message to server
    await fetch('/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, recipient: selectedUser, text: messageText })
    });

    // Clear input field after sending
    messageInput.value = '';
    loadMessages(sender, selectedUser); // Reload messages to include the new one
    scrollToBottom(); // Scroll to the bottom after sending a message
}