/**
 * Luxuria Safes - Static JS
 */
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-navigation');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mainNav.classList.toggle('nav-open');
            // Prevent scrolling when menu is open
            document.body.style.overflow = mainNav.classList.contains('nav-open') ? 'hidden' : '';
        });
    }

    // Sticky Header
    const header = document.getElementById('masthead');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }

    // Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal-up, .reveal-scale').forEach(el => observer.observe(el));
});

// Gallery Functions
function updateGallery(mainImage, element, src) {
    if (mainImage) {
        // Simple fade effect
        mainImage.style.opacity = 0;
        setTimeout(() => {
            mainImage.src = src;
            mainImage.style.opacity = 1;
            mainImage.style.transition = 'opacity 0.3s ease';
        }, 150);
    }
    
    document.querySelectorAll('.gallery-thumbnails .thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    element.classList.add('active');
}
// Accordion Logic
document.addEventListener("DOMContentLoaded", function () {

const btn = document.getElementById("toggleTable");
const accordion = document.getElementById("specAccordion");

btn.addEventListener("click", function () {

accordion.classList.toggle("open");

if (accordion.classList.contains("open")) {
btn.innerHTML = "Hide Specifications";
} else {
btn.innerHTML = "View Full Specifications";
}

});

});

// Compartment Slider Logic
let currentSlideIndex = 0;
function slideCompartments(direction) {
    const track = document.getElementById('compartmentTrack');
    if (!track) return;
    
    const items = track.querySelectorAll('.slider-item');
    if (items.length === 0) return;
    
    const totalItems = items.length;
    const itemsToShow = window.innerWidth <= 767 ? 2 : 4;
    const maxIndex = Math.max(0, totalItems - itemsToShow);
    
    currentSlideIndex += direction * itemsToShow;
    
    if (currentSlideIndex < 0) currentSlideIndex = 0;
    if (currentSlideIndex > maxIndex) currentSlideIndex = maxIndex;
    
    const itemWidth = items[0].offsetWidth;
    const gap = 10;
    const movePx = currentSlideIndex * (itemWidth + gap);
    
    track.style.transform = `translateX(-${movePx}px)`;
}
