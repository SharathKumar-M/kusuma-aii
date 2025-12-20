/***********************
 * GLOBAL STATE
 ***********************/
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userInput");
const historyList = document.getElementById("historyList");
const sidebar = document.getElementById("sidebar");
const sendBtn = document.getElementById("sendBtn");


let voiceEnabled = true;
let conversations = JSON.parse(localStorage.getItem("conversations")) || [];
let currentChat = {
  id: Date.now(),
  title: "New chat",
  messages: []
};


/***********************
 * INITIAL LOAD
 ***********************/
renderSidebar();

/***********************
 * UI HELPERS
 ***********************/
function addMessage(text, sender, steps = null, save = true) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerText = text;

  if (steps) {
    const stepDiv = document.createElement("div");
    stepDiv.className = "steps";
    stepDiv.innerText = steps;
    msg.appendChild(stepDiv);
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (save) {
    currentChat.messages.push({ text, sender, steps });

    // Set title from first user message
    if (sender === "user" && currentChat.title === "New chat") {
      currentChat.title = text.slice(0, 30);
      updateHistory();
    }
  }

  if (sender === "bot" && voiceEnabled) speak(text);
}


function showThinking() {
  const div = document.createElement("div");
  div.className = "message bot thinking";
  div.id = "thinking";
  div.innerText = "AI is thinking...";
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeThinking() {
  const t = document.getElementById("thinking");
  if (t) t.remove();
}

/***********************
 * CHAT SEND
 ***********************/
function sendMessage(textFromVoice = null) {
  const text = textFromVoice || input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  showThinking();

  setTimeout(() => {
    removeThinking();

    const result = calculateWithSteps(text);

    addMessage(result.answer, "bot", result.steps);
    saveConversation();
  }, 600);
}

sendBtn.addEventListener("click", () => {
  sendMessage();
});


/***********************
 * AI CALCULATION
 ***********************/
function calculateWithSteps(inputText) {
  try {
    let text = inputText.toLowerCase();

    // Percentage
    if (text.includes("percent of")) {
      const [p, n] = text.match(/\d+/g);
      const result = (p / 100) * n;
      return {
        answer: `Answer: ${result}`,
        steps: `${p}% of ${n} = (${p}/100) × ${n}`
      };
    }

    // Square
    if (text.includes("square of")) {
      const n = Number(text.match(/\d+/)[0]);
      return {
        answer: `Answer: ${n ** 2}`,
        steps: `${n} × ${n}`
      };
    }

    // Cube root
    if (text.includes("cube root of")) {
      const n = Number(text.match(/\d+/)[0]);
      return {
        answer: `Answer: ${Math.cbrt(n)}`,
        steps: `Cube root of ${n}`
      };
    }

    // Fallback (your existing logic)
    let expr = text
      .replace("plus", "+")
      .replace("minus", "-")
      .replace("times", "*")
      .replace("multiply", "*")
      .replace("divide", "/")
      .replace("by", "");

    const result = eval(expr);

    return {
      answer: `Answer: ${result}`,
      steps: `Evaluated: ${expr}`
    };

  } catch {
    return { answer: "I couldn't understand that.", steps: null };
  }
}


/***********************
 * SIDEBAR HISTORY
 ***********************/
function saveConversation() {
  const index = conversations.findIndex(c => c.id === currentChat.id);

  if (index === -1) {
    conversations.unshift(currentChat); // newest on top
  } else {
    conversations[index] = currentChat;
  }

  localStorage.setItem("conversations", JSON.stringify(conversations));
  renderSidebar();
}


function renderSidebar() {
  historyList.innerHTML = "";

  conversations.forEach(chat => {
    const li = document.createElement("li");
    li.className = "history-item";

    if (chat.id === currentChat.id) {
      li.classList.add("active");
    }

    const title = document.createElement("span");
    title.innerText = chat.title;
    title.onclick = () => loadConversation(chat.id);

    const delBtn = document.createElement("button");
    delBtn.innerText = "🗑";
    delBtn.className = "delete-btn";
    delBtn.onclick = (e) => {
      e.stopPropagation(); // prevent loading chat
      deleteConversation(chat.id);
    };

    li.appendChild(title);
    li.appendChild(delBtn);
    historyList.appendChild(li);
  });
}



function loadConversation(id) {
  const chat = conversations.find(c => c.id === id);
  if (!chat) return;

  chatBox.innerHTML = "";
  currentChat = chat;

  chat.messages.forEach(m =>
    addMessage(m.text, m.sender, m.steps, false)
  );

  renderSidebar();
}

function newChat() {
  currentChat = {
    id: Date.now(),
    title: "New chat",
    messages: []
  };

  chatBox.innerHTML = "";
  renderSidebar();
}

function deleteConversation(id) {
  if (!confirm("Delete this conversation?")) return;

  conversations = conversations.filter(chat => chat.id !== id);

  if (currentChat.id === id) {
    newChat();
  }

  localStorage.setItem("conversations", JSON.stringify(conversations));
  renderSidebar();
}


/***********************
 * VOICE INPUT (MIC)
 ***********************/
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";

  document.getElementById("micBtn").onclick = () => {
    recognition.start();
  };

  recognition.onresult = (e) => {
    sendMessage(e.results[0][0].transcript);
  };
}

/***********************
 * VOICE OUTPUT (TTS)
 ***********************/
function speak(text) {
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
}

/***********************
 * TOGGLES
 ***********************/
function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  alert(`Voice replies ${voiceEnabled ? "ON" : "OFF"}`);
}

function toggleSidebar() {
  sidebar.style.display =
    sidebar.style.display === "block" ? "none" : "block";
}

/***********************
 * ENTER KEY SUPPORT
 ***********************/
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

