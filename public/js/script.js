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

    let isDragging = false;
    let startX;
    let scrollLeft;

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
        const walk = (x - startX) * 2;
        testimonialCarousel.scrollLeft = scrollLeft - walk;
    });

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

            const readMoreBtn = document.createElement("span");
            readMoreBtn.textContent = "קרא עוד";
            readMoreBtn.className = "read-more-btn";
            paragraph.parentElement.appendChild(readMoreBtn);

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

    // --- קרא עוד לחלק האודות ---
    const readMoreBtn = document.getElementById("readMoreBtn");
    const aboutText = document.querySelector(".about-text");
    const aboutSection = document.querySelector(".about-section");

    readMoreBtn.addEventListener("click", () => {
        aboutText.classList.toggle("show");
        readMoreBtn.textContent = aboutText.classList.contains("show")
            ? "הצג פחות"
            : "קרא עוד";
    });

    document.querySelector('a[href="#about"]').addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("about").scrollIntoView({ behavior: "smooth" });
        aboutText.classList.add("show");
        readMoreBtn.textContent = "הצג פחות";
    });

    // --- אפקטי צד לחלק האודות ---
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    aboutSection.classList.add("in-view");
                } else {
                    aboutSection.classList.remove("in-view");
                }
            });
        },
        { threshold: 0.5 }
    );

    observer.observe(aboutSection);

    // --- אפקטי גלילה נוספים לחלק הציטוט החדש ---
    const quoteSection = document.querySelector(".quote-section");
    if (quoteSection) {
        const quoteObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        quoteSection.classList.add("in-view");
                    }
                });
            },
            { threshold: 0.5 }
        );

        quoteObserver.observe(quoteSection);
    }
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");

    // הוספת האזנה ללחיצה על כפתור ההמבורגר
    hamburgerBtn.addEventListener("click", () => {
        navMenu.classList.toggle("show");
        hamburgerBtn.classList.toggle("active");
    });

    // סגירת התפריט כאשר לוחצים על קישור
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("show");
            hamburgerBtn.classList.remove("active");
        });
    });
});
