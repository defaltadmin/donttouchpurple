// Animates a dust icon flying from a source element to the wallet counter
export function animateDustClaim(
  sourceEl: HTMLElement,
  targetSelector: string = '.dust-counter', // CSS selector for wallet display
  amount: number = 0,
  onComplete?: () => void
): void {
  const target = document.querySelector(targetSelector) as HTMLElement | null;
  if (!target) { onComplete?.(); return; }

  const srcRect = sourceEl.getBoundingClientRect();
  const tgtRect = target.getBoundingClientRect();

  const particle = document.createElement('div');
  particle.textContent = `+${amount} 💜`;
  particle.style.cssText = `
    position: fixed;
    left: ${srcRect.left + srcRect.width / 2}px;
    top: ${srcRect.top + srcRect.height / 2}px;
    font-size: 16px;
    font-weight: 800;
    font-family: var(--font-ui, monospace);
    color: #e879f9;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: none;
  `;
  document.body.appendChild(particle);

  const dx = tgtRect.left + tgtRect.width / 2 - (srcRect.left + srcRect.width / 2);
  const dy = tgtRect.top + tgtRect.height / 2 - (srcRect.top + srcRect.height / 2);

  requestAnimationFrame(() => {
    particle.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.7s ease';
    particle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.5)`;
    particle.style.opacity = '0';
  });

  setTimeout(() => {
    particle.remove();
    onComplete?.();
  }, 750);
}
