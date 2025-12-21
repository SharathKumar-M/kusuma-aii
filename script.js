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
    const text = inputText.toLowerCase().trim();
    const numbers = text.match(/\d+(\.\d+)?/g)?.map(Number);

    if (!numbers || numbers.length === 0) {
      return { answer: "Please enter a valid math problem.", steps: null };
    }

    /* ---------- PERCENTAGE ---------- */
    if (text.includes("percent")) {
      const [a, b] = numbers;
      const result = (a / 100) * b;
      return {
        answer: `Answer: ${result}`,
        steps: `Step 1: ${a}% = ${a}/100\nStep 2: (${a}/100) × ${b}`
      };
    }

    /* ---------- SQUARE ---------- */
    if (text.includes("square of")) {
      const n = numbers[0];
      return {
        answer: `Answer: ${n * n}`,
        steps: `${n} × ${n}`
      };
    }

    /* ---------- SQUARE ROOT ---------- */
    if (text.includes("square root")) {
      const n = numbers[0];
      return {
        answer: `Answer: ${Math.sqrt(n)}`,
        steps: `Square root of ${n}`
      };
    }

    /* ---------- ADDITION ---------- */
    if (text.includes("add") || text.includes("+")) {
      const result = numbers.reduce((a, b) => a + b);
      return {
        answer: `Answer: ${result}`,
        steps: numbers.join(" + ")
      };
    }

    /* ---------- SUBTRACTION ---------- */
    if (text.includes("subtract") || text.includes("-")) {
      const result = numbers.reduce((a, b) => a - b);
      return {
        answer: `Answer: ${result}`,
        steps: numbers.join(" - ")
      };
    }

    /* ---------- MULTIPLICATION ---------- */
    if (text.includes("multiply") || text.includes("*")) {
      const result = numbers.reduce((a, b) => a * b);
      return {
        answer: `Answer: ${result}`,
        steps: numbers.join(" × ")
      };
    }

    /* ---------- DIVISION ---------- */
    if (text.includes("divide") || text.includes("/")) {
      const result = numbers.reduce((a, b) => a / b);
      return {
        answer: `Answer: ${result}`,
        steps: numbers.join(" ÷ ")
      };
    }

    /* ---------- FALLBACK ---------- */
    return {
      answer: "I understood the text, but not the math type yet.",
      steps: "Try rephrasing the question."
    };

  } catch {
    return { answer: "Something went wrong.", steps: null };
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

