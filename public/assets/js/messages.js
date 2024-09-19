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

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
            // make input readonly for 5 seconds as a cooldown before sending again
            document.getElementById('messageInput').readOnly = true;
            setTimeout(() => {
                document.getElementById('messageInput').readOnly = false;
            }, 5000);
        }
    });
});

async function loadUsers() {
    const response = await fetch('/users');
    const users = await response.json();
    for (const user of users) {
        addSideUser(user.username);
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
        loadMessages(username); // Load messages when a user is selected
    });
}

async function loadMessages(username) {
    const response = await fetch(`/messages/${username}`);
    const messages = await response.json();

    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = ''; // Clear old messages

    for (const message of messages) {
        let messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = `${message.sender}: ${message.text}`;
        messagesContainer.appendChild(messageElement);
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value;

    let badwords = ['fuck', 'shit', 'bitch', 'asshole', 'ass'];
    let filteredText = messageText;
    for (let i = 0; i < badwords.length; i++) {
        if (filteredText.includes(badwords[i])) {
            alert('You cannot use bad words.');
            return;
        } else {
            filteredText = messageText;
        }
    }

    if (filteredText.includes('https://')) {
        alert('Please do not include links.');
        return;
    }

    if (filteredText.length > 255) {
        alert('Your message is too long.');
        return;
    }

    if (messageText.trim() === '' || !selectedUser) return;

    const sender = localStorage.getItem('username'); // Get the sender from localStorage

    // Send message to server
    await fetch('/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, recipient: selectedUser, text: messageText }),
    });

    // Clear input field after sending
    messageInput.value = '';
    loadMessages(selectedUser); // Reload messages to include the new one
}
// User search function
let searchInput = document.getElementById('userSearch');
searchInput.addEventListener('input', () => {
    let users = document.getElementsByClassName('user');
    for (let i = 0; i < users.length; i++) {
        if (users[i].textContent.toLowerCase().includes(searchInput.value.toLowerCase())) {
            users[i].style.display = 'flex';
        } else {
            users[i].style.display = 'none';
        }
    }
});

// Select the first user when the page loads
let users = document.getElementsByClassName('user');
if (users.length > 0) {
    users[0].click();
}
