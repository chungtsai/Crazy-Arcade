// Game entry point
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
} else {
  window.game = new Game();
}
