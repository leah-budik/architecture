document.addEventListener("DOMContentLoaded", () => {
    // --- פונקציונליות להחלפת התמונות ---
    const images = [
        './public/images/a/1.jpg',
        './public/images/a/2.jpg',
        './public/images/a/3.jpg',
        './public/images/a/4.jpg'
    ];
    let currentIndex = 0;
    const heroImageElement = document.querySelector('.hero-image');

    const updateHeroImage = () => {
        heroImageElement.style.backgroundImage = `url(${images[currentIndex]})`;
        currentIndex = (currentIndex + 1) % images.length;
    };

    setInterval(updateHeroImage, 3000);
    updateHeroImage();

    // --- קרוסלת "לקוחות ממליצים" ---
    const testimonialCarousel = document.getElementById("testimonial-carousel");

    let isDragging = false; // משתנה לבדיקה אם הגרירה מתבצעת
    let startX;
    let scrollLeft;

    // --- גרירת עכבר ---
    testimonialCarousel.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.pageX - testimonialCarousel.offsetLeft;
        scrollLeft = testimonialCarousel.scrollLeft;
        testimonialCarousel.style.cursor = "grabbing";
    });

    testimonialCarousel.addEventListener("mouseleave", () => {
        isDragging = false;
        testimonialCarousel.style.cursor = "grab";
    });

    testimonialCarousel.addEventListener("mouseup", () => {
        isDragging = false;
        testimonialCarousel.style.cursor = "grab";
    });

    testimonialCarousel.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - testimonialCarousel.offsetLeft;
        const walk = (x - startX) * 2; // מהירות הגלילה
        testimonialCarousel.scrollLeft = scrollLeft - walk;
    });

    // --- גלילה עם חיצי המקלדת ---
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            testimonialCarousel.scrollBy({ left: -300, behavior: "smooth" });
        } else if (e.key === "ArrowRight") {
            testimonialCarousel.scrollBy({ left: 300, behavior: "smooth" });
        }
    });

    // --- קרא עוד לכרטיסיות המלצות ---
    const testimonials = document.querySelectorAll(".testimonial-card p");

    testimonials.forEach(paragraph => {
        const fullText = paragraph.textContent.trim();
        const maxLength = 500;

        if (fullText.length > maxLength) {
            const shortText = fullText.slice(0, maxLength) + "...";
            paragraph.textContent = shortText;

            // יצירת כפתור "קרא עוד"
            const readMoreBtn = document.createElement("span");
            readMoreBtn.textContent = "קרא עוד";
            readMoreBtn.className = "read-more-btn";
            paragraph.parentElement.appendChild(readMoreBtn);

            // פונקציה להרחבת הטקסט
            readMoreBtn.addEventListener("click", () => {
                if (readMoreBtn.textContent === "קרא עוד") {
                    paragraph.textContent = fullText;
                    readMoreBtn.textContent = "הצג פחות";
                } else {
                    paragraph.textContent = shortText;
                    readMoreBtn.textContent = "קרא עוד";
                }
            });
        }
    });
});





