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
});