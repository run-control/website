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

  // Reveal VECTOR steps sequentially when the section enters the viewport
  const vectorSection = document.querySelector('#vector');
  if (vectorSection) {
    const steps = vectorSection.querySelectorAll('.vector-step');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          steps.forEach((step, index) => {
            setTimeout(() => step.classList.add('visible'), index * 400);
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });
    observer.observe(vectorSection);
  }
});