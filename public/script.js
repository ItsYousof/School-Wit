let username;

if (localStorage.getItem("username") == null) {
    username = prompt("Enter your username");
    localStorage.setItem("username", username);
} else {
    username = localStorage.getItem("username");
}

document.getElementById("message-input").addEventListener("keydown", sendMessage);

function sendMessage(event) {
  if (event.key === "Enter") {
    let message = document.getElementById("message-input").value;
    if (message.trim() !== "") { // Ensures empty messages aren't sent
      sendMessageToServer(message);
      document.getElementById("message-input").value = ""; // Clears input
    }
  }
}

// Show Chat Room Function
function showChat() {
  document.getElementById("landing-page").classList.add("hidden");
  document.getElementById("chat-room").classList.remove("hidden");
}

function sendMessageToServer(message) {
    const url = `/send_message?message=${encodeURIComponent(message)}&username=${encodeURIComponent(username)}`;
    
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
        loadMessagesFromServer();
    })
    .catch((error) => {
        console.error("Error:", error);
    });
}

  

function loadMessagesFromServer() {
  autoScrollToBottom();
  fetch("/load_messages", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    const messageContainer = document.getElementById("messages-container");
    messageContainer.innerHTML = "";
    data.forEach((message) => {
      const messageElement = document.createElement("div");
      messageElement.classList.add("message");
      messageElement.innerHTML = `
        <div class="first">
            <span class="message-username">${message.username}:</span>
            <span class="message-content">${message.message}</span>
        </div>
        <div class="last">
            <span class="message-timestamp">${message.date}</span>
        </div>
      `;
      messageContainer.appendChild(messageElement);
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
}

let messageRenderer = setInterval(loadMessagesFromServer, 1000);

function autoScrollToBottom() {
  const messageContainer = document.getElementById("messages-container");
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
