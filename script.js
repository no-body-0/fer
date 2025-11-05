// --- Initialize CodeMirror ---
const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "python",
  theme: "dracula",
  lineNumbers: true,
  autoCloseBrackets: true
});

document.getElementById("language").addEventListener("change", e => {
  const lang = e.target.value;
  const modes = { python: "python", c: "text/x-csrc", sql: "text/x-sql" };
  editor.setOption("mode", modes[lang] || "python");
});

document.getElementById("runBtn").onclick = runCode;
document.getElementById("shareBtn").onclick = shareCode;

const output = document.getElementById("output");
let inputResolver = null; // promise resolver for input()

// --- Simulate interactive input in output box ---
output.addEventListener("keydown", e => {
  if (inputResolver && e.key === "Enter") {
    e.preventDefault();
    const inputLine = e.target.querySelector(".input-line");
    const userInput = inputLine.textContent.trim();
    inputLine.removeAttribute("contenteditable");
    output.innerHTML += "\n";
    removeBlinker();
    inputResolver(userInput);
    inputResolver = null;
  }
});

function askInput(promptText) {
  return new Promise(resolve => {
    output.innerHTML += promptText;
    const span = document.createElement("span");
    span.className = "input-line";
    span.contentEditable = true;
    output.appendChild(span);
    addBlinker();
    span.focus();
    inputResolver = resolve;
  });
}

// --- Run Code Function ---
async function runCode() {
  output.innerHTML = ">>> Running your code...\n";
  removeBlinker();

  const lang = document.getElementById("language").value;
  const userCode = editor.getValue();

  const matches = [...userCode.matchAll(/input\s*\((.*?)\)/g)];
  const inputs = [];

  for (let i = 0; i < matches.length; i++) {
    const promptText = matches[i][1].replace(/['"]/g, "") || "";
    const val = await askInput(promptText);
    inputs.push(val);
  }

  const formData = new FormData();
  formData.append("language", lang);
  formData.append("stdin", inputs.join("\n"));
  formData.append("code", userCode);

  addBlinker();

  try {
    const res = await fetch("https://backend-repo-j0ed.onrender.com/run", {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    showOutput(result.output || result.message || "No output.");
  } catch {
    showOutput("Error: Unable to connect to backend.");
  }
}

// --- Output Display ---
function showOutput(text) {
  removeBlinker();
  output.innerHTML += text + "\n";
  addBlinker();
}

// --- Share Code Function ---
async function shareCode() {
  const lang = document.getElementById("language").value;
  const userCode = editor.getValue();

  const res = await fetch("https://backend-repo-j0ed.onrender.com/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: userCode, language: lang })
  });
  const result = await res.json();

  navigator.clipboard.writeText(result.url);
  alert("✅ Link copied!\n" + result.url);
}

// --- Blinker Management ---
function addBlinker() {
  if (!document.querySelector(".blink")) {
    const blinker = document.createElement("span");
    blinker.className = "blink";
    output.appendChild(blinker);
  }
}

function removeBlinker() {
  const b = document.querySelector(".blink");
  if (b) b.remove();
}
