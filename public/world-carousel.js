(() => {
  const carousel = document.querySelector('.world-carousel');
  if (!carousel) return;

  const stage = carousel.querySelector('.world-stage');
  const slides = [...carousel.querySelectorAll('.world-slide')];
  const selectors = [...carousel.querySelectorAll('[data-world-select]')];
  const announcement = carousel.querySelector('.world-announcement');
  const counter = carousel.querySelector('.world-counter');
  let selected = 0;

  function showWorld(index, announce = true) {
    selected = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== selected; });
    selectors.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    counter.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    const title = slides[selected].querySelector('h3').textContent;
    stage.setAttribute('aria-label', `World ${selected + 1} of ${slides.length}: ${title}`);
    if (announce) {
      const status = slides[selected].querySelector('.world-status').textContent;
      announcement.textContent = `${title}. ${status}. World ${selected + 1} of ${slides.length}.`;
    }
  }

  carousel.querySelector('#world-previous').addEventListener('click', () => showWorld(selected - 1));
  carousel.querySelector('#world-next').addEventListener('click', () => showWorld(selected + 1));
  selectors.forEach(button => button.addEventListener('click', () => showWorld(Number(button.dataset.worldSelect))));
  carousel.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let next;
    if (event.key === 'ArrowLeft') next = selected - 1;
    else if (event.key === 'ArrowRight') next = selected + 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = slides.length - 1;
    else return;
    event.preventDefault();
    showWorld(next);
  });

  let gesture = null;
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType)) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    // Leave taps and vertical page scrolling alone.
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      showWorld(selected + (dx < 0 ? 1 : -1));
    }
  });
  stage.addEventListener('pointercancel', () => { gesture = null; });

  // Manual navigation: nothing auto-rotates or moves a reader's focus.
  showWorld(0, false);
  carousel.querySelector('.world-controls').hidden = false;
})();
