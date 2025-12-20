/***********************
 * GLOBAL STATE
 ***********************/
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userInput");
const historyList = document.getElementById("historyList");
const sidebar = document.getElementById("sidebar");

let voiceEnabled = true;
let conversations = JSON.parse(localStorage.getItem("conversations")) || [];
let currentChat = [];

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

  if (save) currentChat.push({ text, sender, steps });

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

/***********************
 * AI CALCULATION
 ***********************/
function calculateWithSteps(inputText) {
  try {
    let expr = inputText.toLowerCase()
      .replace("plus", "+")
      .replace("minus", "-")
      .replace("times", "*")
      .replace("multiply", "*")
      .replace("divide", "/")
      .replace("by", "")
      .replace("power", "**");

    if (expr.includes("square root")) {
      const num = Number(expr.replace("square root of", ""));
      return {
        answer: `Answer: ${Math.sqrt(num)}`,
        steps: `Square root of ${num}`
      };
    }

    const result = eval(expr);

    return {
      answer: `Answer: ${result}`,
      steps: `Evaluated expression: ${expr}`
    };
  } catch {
    return {
      answer: "I couldn't understand that.",
      steps: null
    };
  }
}

/***********************
 * SIDEBAR HISTORY
 ***********************/
function saveConversation() {
  if (!conversations.includes(currentChat)) {
    conversations.push(currentChat);
  }
  localStorage.setItem("conversations", JSON.stringify(conversations));
  renderSidebar();
}

function renderSidebar() {
  historyList.innerHTML = "";
  conversations.forEach((conv, index) => {
    const li = document.createElement("li");
    li.innerText = conv[0]?.text || "Conversation";
    li.onclick = () => loadConversation(index);
    historyList.appendChild(li);
  });
}

function loadConversation(index) {
  chatBox.innerHTML = "";
  currentChat = conversations[index];
  currentChat.forEach(m =>
    addMessage(m.text, m.sender, m.steps, false)
  );
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

