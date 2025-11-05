const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "python",
  theme: "dracula",
  lineNumbers: true,
  autoCloseBrackets: true
});

document.getElementById("runBtn").onclick = runCode;
document.getElementById("shareBtn").onclick = shareCode;

let outputBox = document.getElementById("output");
let inputBuffer = "";
let awaitingInput = false;
let inputResolver = null;

function appendOutput(text) {
  outputBox.innerHTML += text.replace(/\n/g, "<br>");
  outputBox.scrollTop = outputBox.scrollHeight;
}

function addBlinker() {
  const blink = document.createElement("span");
  blink.classList.add("blinker");
  blink.textContent = "█";
  outputBox.appendChild(blink);
}

outputBox.addEventListener("click", () => outputBox.focus());
document.addEventListener("keydown", (e) => {
  if (awaitingInput) {
    const blinker = document.querySelector(".blinker");
    if (e.key === "Enter") {
      e.preventDefault();
      appendOutput("<br>");
      awaitingInput = false;
      blinker.remove();
      inputResolver(inputBuffer);
      inputBuffer = "";
    } else if (e.key === "Backspace") {
      e.preventDefault();
      inputBuffer = inputBuffer.slice(0, -1);
      blinker.previousSibling?.remove();
    } else if (e.key.length === 1) {
      inputBuffer += e.key;
      const span = document.createElement("span");
      span.textContent = e.key;
      outputBox.insertBefore(span, blinker);
    }
  }
});

async function promptInput(promptText) {
  appendOutput(promptText);
  addBlinker();
  awaitingInput = true;
  return new Promise(resolve => (inputResolver = resolve));
}

async function runCode() {
  outputBox.innerHTML = ">>> Running your code...<br>";
  const userCode = editor.getValue();
  let inputs = "";

  // Detect all input() occurrences
  const matches = userCode.match(/input\s*\((.*?)\)/g) || [];
  for (const match of matches) {
    const promptText = match.match(/input\s*\((.*?)\)/)[1]?.replace(/['"]/g, "") || "";
    const value = await promptInput(promptText + " ");
    inputs += value + "\n";
  }

  const res = await fetch("https://your-backend-url.onrender.com/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: userCode, stdin: inputs.trim() })
  });

  const result = await res.json();
  appendOutput(`<br>${result.output}`);
}

async function shareCode() {
  const userCode = editor.getValue();
  const res = await fetch("https://your-backend-url.onrender.com/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: userCode, language: "python" })
  });
  const result = await res.json();
  navigator.clipboard.writeText(result.url);
  alert("✅ Link copied!\n" + result.url);
}
