const backendURL = "https://backend-repo-j0ed.onrender.com";
const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "python",
  theme: "default",
  lineNumbers: true,
});

const runBtn = document.getElementById("runBtn");
const shareBtn = document.getElementById("shareBtn");
const output = document.getElementById("output");
const languageSelect = document.getElementById("language");

let waitingForInput = false;
let currentResolve = null;
let accumulatedInput = [];

// -----------------------------
// Helper functions
// -----------------------------
function appendOutput(text) {
  output.textContent += text;
  output.scrollTop = output.scrollHeight;
}

function setBlinkingCursor(active) {
  if (active) output.classList.add("blink");
  else output.classList.remove("blink");
}

function askForInput(promptText) {
  appendOutput(promptText);
  setBlinkingCursor(true);
  waitingForInput = true;

  return new Promise((resolve) => {
    currentResolve = resolve;
  });
}

output.addEventListener("keydown", (e) => {
  if (waitingForInput) {
    if (e.key === "Enter") {
      e.preventDefault();
      const lines = output.textContent.split("\n");
      const inputValue = lines[lines.length - 1].split(": ").pop().trim();
      appendOutput("\n");
      waitingForInput = false;
      setBlinkingCursor(false);
      accumulatedInput.push(inputValue);
      currentResolve(inputValue);
    }
  }
});

// -----------------------------
// Main run handler
// -----------------------------
runBtn.addEventListener("click", async () => {
  const code = editor.getValue();
  const language = languageSelect.value;

  output.textContent = ">>> Running your code...\n";
  accumulatedInput = [];

  await executeCode(code, language);
});

// -----------------------------
// Recursive executor
// -----------------------------
async function executeCode(code, language, manualInput = "") {
  try {
    const res = await fetch(`${backendURL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language,
        input: manualInput,
      }),
    });

    const data = await res.json();

    if (data.prompt) {
      // Python asking for input
      const userValue = await askForInput(data.prompt);
      await executeCode(code, language, userValue);
    } else {
      appendOutput(data.output || "\nNo output.");
    }
  } catch (err) {
    appendOutput("\n⚠️ Error: " + err.message);
  }
}

// -----------------------------
// Share button
// -----------------------------
shareBtn.addEventListener("click", async () => {
  const code = editor.getValue();
  const res = await fetch(`${backendURL}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();
  const shareURL = `${window.location.origin}?id=${data.id}`;
  navigator.clipboard.writeText(shareURL);
  alert("🔗 Link copied: " + shareURL);
});
