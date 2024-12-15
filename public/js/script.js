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

    // --- קרוסלת "פרויקטים נבחרים" ---
    const projectCarousel = document.getElementById("carousel");
    const projectLeftArrow = document.getElementById("left-arrow");
    const projectRightArrow = document.getElementById("right-arrow");
    const scrollStep = 320;

    const updateProjectArrows = () => {
        projectLeftArrow.style.visibility = projectCarousel.scrollLeft <= 0 ? "hidden" : "visible";
        projectRightArrow.style.visibility =
            projectCarousel.scrollLeft + projectCarousel.offsetWidth >= projectCarousel.scrollWidth
                ? "hidden"
                : "visible";
    };

    projectLeftArrow.addEventListener("click", () => {
        projectCarousel.scrollBy({ left: -scrollStep, behavior: "smooth" });
    });

    projectRightArrow.addEventListener("click", () => {
        projectCarousel.scrollBy({ left: scrollStep, behavior: "smooth" });
    });

    projectCarousel.addEventListener("scroll", updateProjectArrows);
    updateProjectArrows();

    // --- קרוסלת "לקוחות ממליצים" ---
    const testimonialCarousel = document.getElementById("testimonial-carousel");
    const testimonialLeftArrow = document.getElementById("testimonial-left-arrow");
    const testimonialRightArrow = document.getElementById("testimonial-right-arrow");
    const scrollStepTestimonials = 300; // גלילה קטנה יותר מתאימה להמלצות

    const updateTestimonialArrows = () => {
        testimonialLeftArrow.style.visibility = testimonialCarousel.scrollLeft <= 0 ? "hidden" : "visible";
        testimonialRightArrow.style.visibility =
            testimonialCarousel.scrollLeft + testimonialCarousel.offsetWidth >= testimonialCarousel.scrollWidth
                ? "hidden"
                : "visible";
    };

    testimonialLeftArrow.addEventListener("click", () => {
        testimonialCarousel.scrollBy({ left: -scrollStepTestimonials, behavior: "smooth" });
    });

    testimonialRightArrow.addEventListener("click", () => {
        testimonialCarousel.scrollBy({ left: scrollStepTestimonials, behavior: "smooth" });
    });

    testimonialCarousel.addEventListener("scroll", updateTestimonialArrows);
    updateTestimonialArrows();

    // --- עיצוב מחדש והתאמת כרטיסיות ההמלצות ---
    const testimonialCards = document.querySelectorAll(".testimonial-card");

    const resizeTestimonialCards = () => {
        const screenWidth = window.innerWidth;

        testimonialCards.forEach((card) => {
            if (screenWidth < 768) {
                card.style.flex = "0 0 80%"; // התאמה למובייל
                card.style.maxWidth = "80%";
            } else {
                card.style.flex = "0 0 300px"; // גודל קבוע לדסקטופ
                card.style.maxWidth = "300px";
            }
        });
    };

    window.addEventListener("resize", resizeTestimonialCards);
    resizeTestimonialCards();
});




