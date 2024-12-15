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

    const updateTestimonialArrows = () => {
        testimonialLeftArrow.style.visibility = testimonialCarousel.scrollLeft <= 0 ? "hidden" : "visible";
        testimonialRightArrow.style.visibility =
            testimonialCarousel.scrollLeft + testimonialCarousel.offsetWidth >= testimonialCarousel.scrollWidth
                ? "hidden"
                : "visible";
    };

    testimonialLeftArrow.addEventListener("click", () => {
        testimonialCarousel.scrollBy({ left: -scrollStep, behavior: "smooth" });
    });

    testimonialRightArrow.addEventListener("click", () => {
        testimonialCarousel.scrollBy({ left: scrollStep, behavior: "smooth" });
    });

    testimonialCarousel.addEventListener("scroll", updateTestimonialArrows);
    updateTestimonialArrows();

    // --- החזרת כרטיסיות המלצות למצב המקורי ---
    const testimonialCards = document.querySelectorAll(".testimonial-card");

    testimonialCards.forEach((card) => {
        card.style.flex = "0 0 300px"; // מחזיר את הרוחב הקבוע
        card.style.maxWidth = "300px"; // מקסימום רוחב
    });

    // --- התאמת גלריות למובייל ---
    const resizeCarousels = () => {
        const screenWidth = window.innerWidth;

        if (screenWidth < 768) {
            projectCarousel.style.scrollSnapType = "x mandatory";
            testimonialCarousel.style.scrollSnapType = "x mandatory";

            testimonialCards.forEach((card) => {
                card.style.flex = "0 0 80%"; // כרטיסיות גדולות יותר במובייל
                card.style.maxWidth = "90%";
            });
        } else {
            testimonialCards.forEach((card) => {
                card.style.flex = "0 0 300px"; // מחזיר את הרוחב הקודם במסכים גדולים
                card.style.maxWidth = "300px";
            });
        }
    };

    window.addEventListener("resize", resizeCarousels);
    resizeCarousels();
});



