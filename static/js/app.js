// Custom interactivity for Vectari landing page
// This script enables cards to expand and reveal additional details when clicked.

document.addEventListener('DOMContentLoaded', function () {
  // Attach listeners to card headers so only the titles toggle details.
  // This prevents body text (e.g., framework names) from behaving like links.
  const cards = document.querySelectorAll('.cards .card');
  cards.forEach(function (card) {
    const header = card.querySelector('h3');
    if (header) {
      header.addEventListener('click', function () {
        card.classList.toggle('active');
      });
    }
  });

  // Framework compliance items may also contain hidden details. They use the class
  // `.framework-item` instead of `.card`. Toggle the `active` class on click to
  // animate the expansion of `.framework-details` within.
  const frameworkItems = document.querySelectorAll('.framework-item');
  frameworkItems.forEach(function (item) {
    item.addEventListener('click', function () {
      item.classList.toggle('active');
    });
  });
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    const nextSection = document.querySelector('#problems');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    scrollIndicator.addEventListener('click', function () {
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    });

    let lastKnownScrollY = 0;
    let ticking = false;

    const updateIndicator = function () {
      if (lastKnownScrollY > 10) {
        scrollIndicator.classList.add('hide');
      } else {
        scrollIndicator.classList.remove('hide');
      }
      ticking = false;
    };

    const onScroll = function () {
      lastKnownScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(updateIndicator);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    lastKnownScrollY = window.scrollY;
    updateIndicator();
  }
});
