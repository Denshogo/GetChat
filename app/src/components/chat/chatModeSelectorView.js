export function renderChatModeSelector(container, modes, selectedMode) {
  container.innerHTML = "";

  modes.forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chat-mode-button ${mode.tone}`;
    button.dataset.mode = mode.id;
    button.setAttribute("aria-pressed", String(selectedMode === mode.id));

    if (selectedMode === mode.id) {
      button.classList.add("is-selected");
    }

    const name = document.createElement("span");
    name.className = "chat-mode-name";
    name.textContent = mode.label;

    button.appendChild(name);
    container.appendChild(button);
  });
}
