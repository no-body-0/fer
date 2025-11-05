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
  const lang = document.getElementById("language").value;
  const userCode = editor.getValue();

  // Handle input() prompts
  const inputs = [];
  const matches = [...userCode.matchAll(/input\s*\(/g)];
  for (let i = 0; i < matches.length; i++) {
    const ans = prompt(`Enter value for input ${i + 1}:`);
    inputs.push(ans);
  }

  const formData = new FormData();
  formData.append("language", lang);
  formData.append("stdin", inputs.join("\n"));
  formData.append("code", userCode);

  const files = document.getElementById("fileUpload").files;
  for (let i = 0; i < files.length; i++) formData.append("files", files[i]);

  const res = await fetch("https://backend-repo-j0ed.onrender.com/run", {
    method: "POST",
    body: formData
  });
  const result = await res.json();
  document.getElementById("output").textContent = result.output || result.message || "No output.";
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
