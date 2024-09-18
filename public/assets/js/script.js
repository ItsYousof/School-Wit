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

function addUser(username) { 
    fetch('/add_user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username
        })
    });
}

function addTweet(text, username) { 
    const tweet = document.createElement('div');
    tweet.classList.add('tweet');
    tweet.innerHTML = `
    <div class="tweet-mains">
        <div class="left">
            <img class="user-avatar" src="assets/images/user-avater.png" alt="user avatar">
            <h3 id="uesrname">@${username}</h3>
        </div>
        <div class="right">
            <p id="tweetText">${text}</p>
        </div>
    </div>
    `;
    document.getElementById('tweetsContainer').appendChild(tweet);
}

function postTweet(username, text) { 
    addTweet(text, username);
    document.getElementById('tweetInput').value = '';

    fetch('/tweet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            text: text
        })
    });
}

document.getElementById('postTweetBtn').addEventListener('click', () => {
    postTweet(localStorage.getItem('username'), document.getElementById('tweetInput').value);
});

async function loadTweets() {
    const response = await fetch('/tweets');
    const tweets = await response.json();
    for (const tweet of tweets) {
        addTweet(tweet.text, tweet.username);
    }
}


loadTweets();

let devtools = function() {};
devtools.toString = function() {
    alert("DevTools detected. Please close them.");
    window.close();
};
console.log("%c", devtools);
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
    }
};

