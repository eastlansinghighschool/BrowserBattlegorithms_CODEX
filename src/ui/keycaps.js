function escapeHtml(value) {
  return `${value || ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderKeycap(label) {
  return `<span class="app-keycap">${escapeHtml(label)}</span>`;
}

export function renderKeycaps(keys = []) {
  return `<span class="app-keycaps">${keys.map((key) => renderKeycap(key)).join("")}</span>`;
}

export function renderControlRows(rows = []) {
  return `
    <div class="control-chip-list">
      ${rows.map((row) => `
        <div class="control-chip-row">
          <span class="control-chip-label">${escapeHtml(row.label)}</span>
          ${renderKeycaps(row.keys)}
          <span class="control-chip-description">${escapeHtml(row.description)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

