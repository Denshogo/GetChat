export function renderSubjectChips(container, subjects, selectedSubject) {
  container.innerHTML = "";

  subjects.forEach((subject) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "subject-chip";
    chip.dataset.subject = subject;
    chip.textContent = subject;

    if (subject === selectedSubject) {
      chip.classList.add("active");
    }

    container.appendChild(chip);
  });
}
