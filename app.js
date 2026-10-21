// After deploying your backend, replace this with its real URL.
// Example: https://your-toolwise-api.onrender.com
const API_BASE = "PASTE_YOUR_BACKEND_URL_HERE";

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showMessage(text, isError = false) {
  const box = $("message");
  box.textContent = text;
  box.classList.remove("hidden", "error");
  if (isError) box.classList.add("error");
}

function hideMessage() {
  $("message").classList.add("hidden");
}

function accessClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("free plan")) return "access-free";
  if (value === "free") return "access-free";
  if (value.includes("paid")) return "access-paid";
  if (value.includes("trial")) return "access-trial";
  return "access-unknown";
}

function renderResults(items) {
  const container = $("results");
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `
      <article class="empty-card">
        <div class="empty-icon">⌕</div>
        <h3>No results found</h3>
        <p>Try another description or use a broader category.</p>
      </article>`;
    return;
  }

  for (const item of items) {
    const title = escapeHTML(item.title || "Untitled result");
    const description = escapeHTML(
      item.description || "Open the website to learn more."
    );
    const url = safeWebsiteURL(item.url);
    const domain = escapeHTML(item.domain || "");
    const status = escapeHTML(item.access_status || "Unknown");
    const statusClass = accessClass(item.access_status);
    const reason = escapeHTML(item.access_reason || "Check the official website.");
    const accessEvidence = escapeHTML(
      item.access_evidence || "The access type has not been independently verified."
    );
    const iconLetter = escapeHTML((item.title || "T").trim().charAt(0).toUpperCase());

    const card = document.createElement("article");
    card.className = "tool-card";
    card.innerHTML = `
      <div class="card-top">
        <div class="tool-icon">${iconLetter}</div>
        <div class="card-heading">
          <h3>${title}</h3>
          <div class="domain">${domain}</div>
        </div>
      </div>

      <span class="access-badge ${statusClass}">${status}</span>

      <p class="card-description">${description}</p>

      <div class="why">
        <strong>Access information:</strong> ${reason}
        <br><br>
        <strong>Evidence:</strong> ${accessEvidence}
      </div>

      <div class="card-actions">
        <a class="visit-link" href="${url}" target="_blank"
           rel="noopener noreferrer">Visit website ↗</a>
      </div>

      <p class="source-note">
        Search results and snippets can be incomplete. Confirm the access model
        on the official website before signing up or paying.
      </p>`;
    container.appendChild(card);
  }
}

function safeWebsiteURL(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
  } catch (_) {}
  return "#";
}

async function searchTools() {
  const goal = $("goal").value.trim();
  const category = $("category").value.trim();
  const access = $("access").value;

  if (!goal && !category) {
    showMessage("Type a goal or category first.", true);
    $("goal").focus();
    return;
  }

  if (!API_BASE || API_BASE === "PASTE_YOUR_BACKEND_URL_HERE") {
    showMessage(
      "Your website is ready, but the backend is not connected yet. " +
      "Deploy the backend and paste its URL at the top of app.js.",
      true
    );
    return;
  }

  const button = $("searchButton");
  button.disabled = true;
  button.querySelector("span:first-child").textContent = "Searching the web...";
  $("resultsTitle").textContent = "Finding tools for your goal...";
  $("resultsSubtitle").textContent = "Searching live web results and checking available access information.";
  hideMessage();

  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, category, access })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Search failed. Please try again.");
    }

    renderResults(data.results || []);
    $("resultsTitle").textContent = category
      ? `Tools for ${category}`
      : "Your tool shortlist";
    $("resultsSubtitle").textContent =
      `${(data.results || []).length} live search results for your goal.`;

    showMessage(data.message || "Search completed. Verify access details on each official website.");
  } catch (error) {
    showMessage(
      `${error.message} Check that your backend is deployed and its API key is configured.`,
      true
    );
  } finally {
    button.disabled = false;
    button.querySelector("span:first-child").textContent = "Find my tools";
  }
}

$("searchButton").addEventListener("click", searchTools);

$("goal").addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    searchTools();
  }
});
