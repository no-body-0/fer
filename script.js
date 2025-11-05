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

// --- Run Code Function ---
async function runCode() {
  output.textContent = ""; // clear
  const lang = document.getElementById("language").value;
  const userCode = editor.getValue();

  // Detect input() calls and handle them interactively
  const inputs = [];
  const matches = [...userCode.matchAll(/input\s*\((.*?)\)/g)];
  for (let i = 0; i < matches.length; i++) {
    const promptText = matches[i][1].replace(/['"]/g, "") || `Input ${i + 1}: `;
    const ans = prompt(promptText);
    inputs.push(ans);
  }

  const formData = new FormData();
  formData.append("language", lang);
  formData.append("stdin", inputs.join("\n"));
  formData.append("code", userCode);

  // Display typing animation + blinking cursor
  output.innerHTML = ">>> Running your code...\n";
  addBlinker();

  try {
    const res = await fetch("https://backend-repo-j0ed.onrender.com/run", {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    const text = result.output || result.message || "No output.";
    showOutputLikeInterpreter(text);
  } catch (err) {
    showOutputLikeInterpreter("Error: Unable to connect to backend.");
  }
}

// --- Output Animation like Python Interpreter ---
function showOutputLikeInterpreter(text) {
  output.innerHTML = "";
  let i = 0;
  function type() {
    if (i < text.length) {
      output.textContent += text[i++];
      setTimeout(type, 10);
    } else {
      addBlinker();
    }
  }
  type();
}

function addBlinker() {
  const blinker = document.createElement("span");
  blinker.className = "blink";
  output.appendChild(blinker);
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
