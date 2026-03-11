export function renderTaskModalState(dom, isOpen) {
  dom.taskModal.classList.toggle("hidden", !isOpen);
}
