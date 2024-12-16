document.addEventListener("DOMContentLoaded", () => {
    const galleryImages = document.querySelectorAll(".gallery img");
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");

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
    closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none";
    });

    // מעבר לתמונה הקודמת
    leftArrow.addEventListener("click", (e) => {
        e.stopPropagation(); // מונע סגירה בלחיצה על החץ
        currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightboxImage();
    });

    // מעבר לתמונה הבאה
    rightArrow.addEventListener("click", (e) => {
        e.stopPropagation(); // מונע סגירה בלחיצה על החץ
        currentIndex = (currentIndex + 1) % galleryImages.length;
        updateLightboxImage();
    });

    // סגירת הלייטבוקס בלחיצה מחוץ לתמונה
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    });

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

