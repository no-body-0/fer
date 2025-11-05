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

// --- Run Code Function ---
async function runCode() {
  const userCode = editor.getValue();

  // Handle input() prompts
  const inputs = [];
  const matches = [...userCode.matchAll(/input\s*\(/g)];
  for (let i = 0; i < matches.length; i++) {
    const ans = prompt(`Enter value for input ${i + 1}:`);
    inputs.push(ans);
  }

  const payload = {
    code: userCode.replace(/input\s*\([^)]*\)/g, () => {
      const val = inputs.shift() || "";
      return `"${val}"`; // replace input() with user-entered value
    })
  };

  try {
    const res = await fetch("https://ber-w16y.onrender.com/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    document.getElementById("output").textContent =
      result.output || "No output.";
  } catch (err) {
    document.getElementById("output").textContent =
      "Error connecting to backend.";
  }
}

// --- Share Code Function ---
async function shareCode() {
  const userCode = editor.getValue();

  try {
    const res = await fetch("https://ber-w16y.onrender.com/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: userCode })
    });

    const result = await res.json();
    navigator.clipboard.writeText(result.url);
    alert("✅ Link copied!\n" + result.url);
  } catch (err) {
    alert("❌ Failed to share code.");
  }
}
