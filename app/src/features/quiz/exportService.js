function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function exportQuizSessionAsPdf(session) {
  if (!session || typeof window.open !== "function") {
    return false;
  }

  const popup = window.open("", "_blank", "width=860,height=960");
  if (!popup) {
    return false;
  }

  const optionsHtml = session.quiz.choices
    .map((choice, index) => {
      const selectedMark = choice.id === session.selectedChoiceId ? " <strong>(選択)</strong>" : "";
      return `<li>${index + 1}. ${escapeHtml(choice.text)}${selectedMark}</li>`;
    })
    .join("");

  popup.document.write(`
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title>問題セット - ${escapeHtml(session.quiz.topic)}</title>
        <style>
          body { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; color: #1f2a1f; padding: 32px; line-height: 1.8; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .meta { color: #5a675d; margin-bottom: 20px; }
          .state { display: inline-block; padding: 4px 10px; border: 1px solid #d1d8d1; border-radius: 999px; font-size: 12px; margin-bottom: 18px; }
          ol { padding-left: 22px; }
          .explanation { margin-top: 20px; padding: 14px; border: 1px solid #d7decf; border-radius: 12px; background: #f7faf5; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>確認問題</h1>
        <p class="meta">${escapeHtml(session.quiz.subject)} / ${escapeHtml(session.quiz.topic)}</p>
        <p class="state">${escapeHtml(session.status)}</p>
        <p>${escapeHtml(session.quiz.question)}</p>
        <ol>${optionsHtml}</ol>
        <div class="explanation">${escapeHtml(session.quiz.explanation)}</div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();

  return true;
}
