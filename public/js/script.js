// document.addEventListener("DOMContentLoaded", () => {
//     // --- פונקציונליות להחלפת התמונות ---
//     const images = [
//         '/public/images/a/1.jpg',
//         '/public/images/a/2.jpg',
//         '/public/images/a/3.jpg',
//         '/public/images/a/4.jpg',
//     ];
//     let currentIndex = 0;
//     const heroImageElement = document.querySelector('.hero-image');

//     const updateHeroImage = () => {
//         heroImageElement.style.backgroundImage = `url(${images[currentIndex]})`;
//         currentIndex = (currentIndex + 1) % images.length;
//     };

//     setInterval(updateHeroImage, 3000);
//     updateHeroImage();

//     // --- קרוסלת תמונות עם חיצים מעגליים ---
//     const carousel = document.getElementById("carousel");
//     const leftArrow = document.getElementById("left-arrow");
//     const rightArrow = document.getElementById("right-arrow");
//     const scrollStep = 310;

//     const getMaxScroll = () => carousel.scrollWidth - carousel.clientWidth;

//     leftArrow.addEventListener("click", () => {
//         if (carousel.scrollLeft <= 0) {
//             carousel.scrollTo({
//                 left: getMaxScroll(),
//                 behavior: "smooth"
//             });
//         } else {
//             carousel.scrollBy({
//                 left: -scrollStep,
//                 behavior: "smooth"
//             });
//         }
//     });

//     rightArrow.addEventListener("click", () => {
//         if (carousel.scrollLeft >= getMaxScroll()) {
//             carousel.scrollTo({
//                 left: 0,
//                 behavior: "smooth"
//             });
//         } else {
//             carousel.scrollBy({
//                 left: scrollStep,
//                 behavior: "smooth"
//             });
//         }
//     });

//     // --- קרא עוד לטקסט ההמלצות ---
//     const testimonials = document.querySelectorAll(".testimonial-card p");

//     testimonials.forEach(paragraph => {
//         const fullText = paragraph.textContent.trim();
//         const maxLength = 400; // מספר המקסימום של תווים

//         if (fullText.length > maxLength) {
//             const shortText = fullText.slice(0, maxLength) + "...";
//             paragraph.textContent = shortText;

//             // יצירת כפתור "קרא עוד"
//             const readMoreBtn = document.createElement("span");
//             readMoreBtn.textContent = "קרא עוד";
//             readMoreBtn.className = "read-more-btn";
//             paragraph.parentElement.appendChild(readMoreBtn);

//             // הוספת אירוע לחיצה
//             readMoreBtn.addEventListener("click", () => {
//                 if (readMoreBtn.textContent === "קרא עוד") {
//                     paragraph.textContent = fullText;
//                     paragraph.classList.add("expanded");
//                     readMoreBtn.textContent = "הצג פחות";
//                 } else {
//                     paragraph.textContent = shortText;
//                     paragraph.classList.remove("expanded");
//                     readMoreBtn.textContent = "קרא עוד";
//                 }
//             });
//         }
//     });
// });

// document.addEventListener("DOMContentLoaded", () => {
//     // --- פונקציונליות להחלפת התמונות ---
//     const images = [
//         '/public/images/a/1.jpg',
//         '/public/images/a/2.jpg',
//         '/public/images/a/3.jpg',
//         '/public/images/a/4.jpg',
//     ];
//     let currentIndex = 0;
//     const heroImageElement = document.querySelector('.hero-image');

//     const updateHeroImage = () => {
//         heroImageElement.style.backgroundImage = `url(${images[currentIndex]})`;
//         currentIndex = (currentIndex + 1) % images.length;
//     };

//     setInterval(updateHeroImage, 3000);
//     updateHeroImage();

//     // --- קרוסלת "פרויקטים נבחרים" ---
//     const projectCarousel = document.getElementById("carousel");
//     const projectLeftArrow = document.getElementById("left-arrow");
//     const projectRightArrow = document.getElementById("right-arrow");
//     const scrollStep = 320;

//     const updateProjectArrows = () => {
//         projectLeftArrow.style.visibility = projectCarousel.scrollLeft <= 0 ? "hidden" : "visible";
//         projectRightArrow.style.visibility =
//             projectCarousel.scrollLeft >= projectCarousel.scrollWidth - projectCarousel.clientWidth
//                 ? "hidden"
//                 : "visible";
//     };

//     projectLeftArrow.addEventListener("click", () => {
//         projectCarousel.scrollBy({ left: -scrollStep, behavior: "smooth" });
//     });

//     projectRightArrow.addEventListener("click", () => {
//         projectCarousel.scrollBy({ left: scrollStep, behavior: "smooth" });
//     });

//     projectCarousel.addEventListener("scroll", updateProjectArrows);
//     updateProjectArrows(); // הפעלת בדיקת חצים בהתחלה

//     // --- קרוסלת "לקוחות ממליצים" ---
//     const testimonialCarousel = document.getElementById("testimonial-carousel");
//     const testimonialLeftArrow = document.getElementById("testimonial-left-arrow");
//     const testimonialRightArrow = document.getElementById("testimonial-right-arrow");

//     const updateTestimonialArrows = () => {
//         testimonialLeftArrow.style.visibility = testimonialCarousel.scrollLeft <= 0 ? "hidden" : "visible";
//         testimonialRightArrow.style.visibility =
//             testimonialCarousel.scrollLeft >= testimonialCarousel.scrollWidth - testimonialCarousel.clientWidth
//                 ? "hidden"
//                 : "visible";
//     };

//     testimonialLeftArrow.addEventListener("click", () => {
//         testimonialCarousel.scrollBy({ left: -scrollStep, behavior: "smooth" });
//     });

//     testimonialRightArrow.addEventListener("click", () => {
//         testimonialCarousel.scrollBy({ left: scrollStep, behavior: "smooth" });
//     });

//     testimonialCarousel.addEventListener("scroll", updateTestimonialArrows);
//     updateTestimonialArrows(); // הפעלת בדיקת חצים בהתחלה
// });



document.addEventListener("DOMContentLoaded", () => {
    // --- פונקציונליות להחלפת התמונות ---
    const images = [
        '/public/images/a/1.jpg',
        '/public/images/a/2.jpg',
        '/public/images/a/3.jpg',
        '/public/images/a/4.jpg',
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
            projectCarousel.scrollLeft >= projectCarousel.scrollWidth - projectCarousel.clientWidth
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
            testimonialCarousel.scrollLeft >= testimonialCarousel.scrollWidth - testimonialCarousel.clientWidth
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
