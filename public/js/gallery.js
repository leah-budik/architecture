/**
 * LEAH BUDIK ARCHITECTURE
 * Premium JavaScript - Gallery & Lightbox
 * Luxury gallery experience with smooth animations
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const elements = {
        header: document.getElementById('header'),
        hamburger: document.getElementById('hamburger'),
        mobileNav: document.getElementById('mobile-nav'),
        mobileNavOverlay: document.getElementById('mobile-nav-overlay'),
        mobileNavClose: document.getElementById('mobile-nav-close'),
        gallery: document.getElementById('gallery'),
        lightbox: document.getElementById('lightbox'),
        lightboxImage: document.getElementById('lightbox-image'),
        lightboxClose: document.getElementById('lightbox-close'),
        lightboxPrev: document.getElementById('lightbox-prev'),
        lightboxNext: document.getElementById('lightbox-next'),
        lightboxCounter: document.getElementById('lightbox-counter'),
        backToTop: document.getElementById('back-to-top')
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let state = {
        images: [],
        currentIndex: 0,
        isLightboxOpen: false,
        isMenuOpen: false,
        touchStartX: 0,
        touchEndX: 0,
        lastFocusedElement: null
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER SCROLL EFFECT
    // ═══════════════════════════════════════════════════════════════════════════
    function initHeaderScroll() {
        function updateHeader() {
            if (window.scrollY > 50) {
                elements.header?.classList.add('scrolled');
            } else {
                elements.header?.classList.remove('scrolled');
            }
        }

        window.addEventListener('scroll', throttle(updateHeader, 100), { passive: true });
        updateHeader();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MOBILE NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════
    function initMobileNav() {
        if (!elements.hamburger || !elements.mobileNav) return;

        // Toggle menu on hamburger click
        elements.hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close menu when clicking close button
        elements.mobileNavClose?.addEventListener('click', closeMenu);

        // Close menu when clicking overlay
        elements.mobileNavOverlay?.addEventListener('click', closeMenu);

        // Close menu when clicking links
        const mobileLinks = elements.mobileNav.querySelectorAll('.mobile-nav__link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isMenuOpen) {
                closeMenu();
            }
        });
    }

    function toggleMenu() {
        state.isMenuOpen = !state.isMenuOpen;
        elements.hamburger.classList.toggle('active', state.isMenuOpen);
        elements.mobileNav.classList.toggle('active', state.isMenuOpen);
        elements.mobileNavOverlay?.classList.toggle('active', state.isMenuOpen);
        document.body.style.overflow = state.isMenuOpen ? 'hidden' : '';

        // Update ARIA attributes for accessibility
        elements.hamburger.setAttribute('aria-expanded', state.isMenuOpen);
        elements.hamburger.setAttribute('aria-label', state.isMenuOpen ? 'סגור תפריט ניווט' : 'פתח תפריט ניווט');
        elements.mobileNav?.setAttribute('aria-hidden', !state.isMenuOpen);
        elements.mobileNavOverlay?.setAttribute('aria-hidden', !state.isMenuOpen);

        // Focus management
        if (state.isMenuOpen) {
            elements.mobileNavClose?.focus();
        }
    }

    function closeMenu() {
        state.isMenuOpen = false;
        elements.hamburger?.classList.remove('active');
        elements.mobileNav?.classList.remove('active');
        elements.mobileNavOverlay?.classList.remove('active');
        document.body.style.overflow = state.isLightboxOpen ? 'hidden' : '';

        // Update ARIA attributes for accessibility
        elements.hamburger?.setAttribute('aria-expanded', 'false');
        elements.hamburger?.setAttribute('aria-label', 'פתח תפריט ניווט');
        elements.mobileNav?.setAttribute('aria-hidden', 'true');
        elements.mobileNavOverlay?.setAttribute('aria-hidden', 'true');

        // Return focus to hamburger button
        elements.hamburger?.focus();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GALLERY INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    function initGallery() {
        if (!elements.gallery) return;

        // Get all gallery images
        const galleryItems = elements.gallery.querySelectorAll('.gallery__item');

        galleryItems.forEach((item, index) => {
            const img = item.querySelector('.gallery__image');
            if (img) {
                state.images.push(img.src);

                // Make gallery items keyboard accessible
                item.setAttribute('role', 'button');
                item.setAttribute('tabindex', '0');
                item.setAttribute('aria-label', `פתח תמונה ${index + 1} מתוך ${galleryItems.length}`);

                item.addEventListener('click', () => {
                    state.lastFocusedElement = item; // Store for focus return
                    openLightbox(index);
                });

                // Keyboard support for gallery items
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        state.lastFocusedElement = item;
                        openLightbox(index);
                    }
                });
            }
        });

        // Stagger animation on load
        galleryItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';

            setTimeout(() => {
                item.style.transition = 'opacity 0.6s cubic-bezier(0.19, 1, 0.22, 1), transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100 + (index * 50));
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIGHTBOX FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════════
    function initLightbox() {
        if (!elements.lightbox) return;

        // Close button
        elements.lightboxClose?.addEventListener('click', closeLightbox);

        // Navigation buttons
        elements.lightboxPrev?.addEventListener('click', (e) => {
            e.stopPropagation();
            showPreviousImage();
        });

        elements.lightboxNext?.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextImage();
        });

        // Click outside to close
        elements.lightbox.addEventListener('click', (e) => {
            if (e.target === elements.lightbox) {
                closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);

        // Mouse wheel navigation
        elements.lightbox.addEventListener('wheel', handleWheel, { passive: false });

        // Touch gestures
        elements.lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
        elements.lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    function openLightbox(index) {
        state.currentIndex = index;
        state.isLightboxOpen = true;

        updateLightboxImage();

        elements.lightbox.classList.add('active');
        elements.lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus trap: focus the close button when lightbox opens
        setTimeout(() => {
            elements.lightboxClose?.focus();
        }, 100);
    }

    function closeLightbox() {
        state.isLightboxOpen = false;
        elements.lightbox.classList.remove('active');
        elements.lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Return focus to the element that opened the lightbox
        if (state.lastFocusedElement) {
            state.lastFocusedElement.focus();
        }
    }

    function updateLightboxImage() {
        if (!elements.lightboxImage) return;

        // Fade out
        elements.lightboxImage.style.opacity = '0';
        elements.lightboxImage.style.transform = 'scale(0.95)';

        setTimeout(() => {
            elements.lightboxImage.src = state.images[state.currentIndex];

            // Fade in
            elements.lightboxImage.style.opacity = '1';
            elements.lightboxImage.style.transform = 'scale(1)';
        }, 150);

        // Update counter
        if (elements.lightboxCounter) {
            elements.lightboxCounter.textContent = `${state.currentIndex + 1} / ${state.images.length}`;
        }
    }

    function showPreviousImage() {
        state.currentIndex = (state.currentIndex - 1 + state.images.length) % state.images.length;
        updateLightboxImage();
    }

    function showNextImage() {
        state.currentIndex = (state.currentIndex + 1) % state.images.length;
        updateLightboxImage();
    }

    function handleKeydown(e) {
        if (!state.isLightboxOpen) return;

        switch(e.key) {
            case 'ArrowLeft':
                showNextImage(); // RTL - left goes next
                break;
            case 'ArrowRight':
                showPreviousImage(); // RTL - right goes previous
                break;
            case 'Escape':
                closeLightbox();
                break;
        }
    }

    function handleWheel(e) {
        if (!state.isLightboxOpen) return;

        e.preventDefault();

        if (e.deltaY > 0) {
            showNextImage();
        } else {
            showPreviousImage();
        }
    }

    function handleTouchStart(e) {
        state.touchStartX = e.touches[0].clientX;
    }

    function handleTouchEnd(e) {
        state.touchEndX = e.changedTouches[0].clientX;
        const diff = state.touchStartX - state.touchEndX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                showNextImage(); // Swipe left - next
            } else {
                showPreviousImage(); // Swipe right - previous
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BACK TO TOP BUTTON
    // ═══════════════════════════════════════════════════════════════════════════
    function initBackToTop() {
        if (!elements.backToTop) return;

        function updateVisibility() {
            if (window.scrollY > 500) {
                elements.backToTop.classList.add('visible');
            } else {
                elements.backToTop.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', throttle(updateVisibility, 100), { passive: true });

        elements.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRELOAD IMAGES
    // ═══════════════════════════════════════════════════════════════════════════
    function preloadImages() {
        state.images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════════════════
    function init() {
        document.addEventListener('DOMContentLoaded', () => {
            initHeaderScroll();
            initMobileNav();
            initGallery();
            initLightbox();
            initBackToTop();

            // Preload images after initial load
            setTimeout(preloadImages, 1000);
        });
    }

    // Start the application
    init();

})();
