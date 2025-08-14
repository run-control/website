// Custom interactivity for Vectari landing page
// This script enables cards to expand and reveal additional details when clicked.

document.addEventListener('DOMContentLoaded', function () {
  // Attach click listeners to any card element across all sections.
  // When a card is clicked, toggle the "active" class to reveal or hide the card-details.
  const cards = document.querySelectorAll('.cards .card');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.toggle('active');
    });
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

  // Smoothly handle discrete mouse-wheel steps
  window.addEventListener('wheel', function (event) {
    event.preventDefault();
    window.scrollBy({ top: event.deltaY, left: 0, behavior: 'smooth' });
  }, { passive: false });
});