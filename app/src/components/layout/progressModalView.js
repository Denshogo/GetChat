export function renderProgressModalState(dom, isOpen) {
  dom.progressModal.classList.toggle("hidden", !isOpen);
}

export function renderProgressModal(dom, progressView) {
  dom.progressModalPoints.textContent = `${progressView.points}pt`;
  dom.progressModalRank.textContent = progressView.currentRank.name;
  dom.progressModalNext.textContent = progressView.isMaxRank
    ? "最高ランクに到達済み"
    : `${progressView.nextRank.name}まであと${progressView.pointsToNextRank}pt`;
}
