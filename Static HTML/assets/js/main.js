/**
 * Luxuria Safes - Static JS
 */
document.addEventListener('DOMContentLoaded', () => {
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
