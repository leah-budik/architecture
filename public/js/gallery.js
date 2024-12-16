document.addEventListener("DOMContentLoaded", () => {
    const galleryImages = document.querySelectorAll(".gallery img");
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");

    // מבנה הלייטבוקס
    lightbox.innerHTML = `
        <span class="close">&times;</span>
        <span class="arrow left">&#10094;</span>
        <img src="" alt="תמונה מוגדלת">
        <span class="arrow right">&#10095;</span>
    `;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector("img");
    const closeBtn = lightbox.querySelector(".close");
    const leftArrow = lightbox.querySelector(".arrow.left");
    const rightArrow = lightbox.querySelector(".arrow.right");

    let currentIndex = 0;

    // פונקציה לעדכון התמונה בלייטבוקס
    const updateLightboxImage = () => {
        lightboxImage.src = galleryImages[currentIndex].src;
    };

    // פתיחת הלייטבוקס
    galleryImages.forEach((img, index) => {
        img.addEventListener("click", () => {
            currentIndex = index;
            updateLightboxImage();
            lightbox.style.display = "flex";
        });
    });

    // סגירת הלייטבוקס
    const closeLightbox = () => {
        lightbox.style.display = "none";
    };

    closeBtn.addEventListener("click", closeLightbox);

    // מעבר לתמונה הקודמת
    const showPreviousImage = () => {
        currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightboxImage();
    };

    leftArrow.addEventListener("click", (e) => {
        e.stopPropagation();
        showPreviousImage();
    });

    // מעבר לתמונה הבאה
    const showNextImage = () => {
        currentIndex = (currentIndex + 1) % galleryImages.length;
        updateLightboxImage();
    };

    rightArrow.addEventListener("click", (e) => {
        e.stopPropagation();
        showNextImage();
    });

    // מעבר בין תמונות באמצעות חיצי המקלדת
    document.addEventListener("keydown", (e) => {
        if (lightbox.style.display === "flex") {
            if (e.key === "ArrowLeft") {
                showPreviousImage();
            } else if (e.key === "ArrowRight") {
                showNextImage();
            } else if (e.key === "Escape") {
                closeLightbox();
            }
        }
    });

    // מעבר בין תמונות עם גלילת עכבר
    lightbox.addEventListener("wheel", (e) => {
        e.preventDefault(); // מונע גלילה ברירת מחדל
        if (e.deltaY > 0) { // גלילה למטה
            showNextImage();
        } else if (e.deltaY < 0) { // גלילה למעלה
            showPreviousImage();
        }
    });

    // מעבר בין תמונות עם מחוות החלקה בנייד
    let startX = 0;

    lightbox.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX; // שמירת מיקום התחלת המחווה
    });

    lightbox.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX; // מיקום סיום המחווה
        const diffX = startX - endX;

        if (diffX > 50) {
            // החלקה שמאלה: מעבר לתמונה הבאה
            showNextImage();
        } else if (diffX < -50) {
            // החלקה ימינה: מעבר לתמונה הקודמת
            showPreviousImage();
        }
    });

    // סגירת הלייטבוקס בלחיצה מחוץ לתמונה
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // תפריט המבורגר
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");

    hamburgerBtn.addEventListener("click", () => {
        navMenu.classList.toggle("show");
        hamburgerBtn.classList.toggle("active");
    });

    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("show");
            hamburgerBtn.classList.remove("active");
        });
    });
});


