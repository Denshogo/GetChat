import { formatDateTime } from "../../utils.js";

export function renderMenuState(dom, isOpen) {
  dom.menuDrawer.classList.toggle("hidden", !isOpen);
  dom.menuDrawer.setAttribute("aria-hidden", String(!isOpen));
}

export function renderConversationList(container, conversations, currentConversationId) {
  container.innerHTML = "";

  if (conversations.length === 0) {
    const empty = document.createElement("p");
    empty.className = "conversation-empty";
    empty.textContent = "まだ会話はありません。";
    container.appendChild(empty);
    return;
  }

  conversations.forEach((conversation) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conversation-item";
    button.dataset.conversationId = conversation.conversation_id;

    if (conversation.conversation_id === currentConversationId) {
      button.classList.add("is-active");
    }

    const title = document.createElement("p");
    title.className = "conversation-title";
    title.textContent = conversation.title || "新しいチャット";

    const meta = document.createElement("p");
    meta.className = "conversation-meta";
    meta.textContent = formatDateTime(conversation.updated_at || conversation.created_at);

    button.append(title, meta);
    container.appendChild(button);
  });
}
