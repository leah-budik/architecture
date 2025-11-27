/**
 * LEAH BUDIK ARCHITECTURE
 * Premium JavaScript - Main Site
 * Luxury animations and interactions
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        heroImages: [
            '/public/images/a/1.jpg',
            '/public/images/a/2.jpg',
            '/public/images/a/3.jpg',
            '/public/images/a/4.jpg'
        ],
        heroInterval: 5000,
        scrollThreshold: 50,
        revealThreshold: 0.15,
        useDynamicContent: true // Set to true to load from API
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SITE DATA (loaded from API)
    // ═══════════════════════════════════════════════════════════════════════════
    let siteContent = null;
    let galleries = [];

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const elements = {
        loader: document.getElementById('loader'),
        loaderBar: document.getElementById('loader-bar'),
        header: document.getElementById('header'),
        hamburger: document.getElementById('hamburger'),
        mobileNav: document.getElementById('mobile-nav'),
        mobileNavOverlay: document.getElementById('mobile-nav-overlay'),
        mobileNavClose: document.getElementById('mobile-nav-close'),
        heroImages: [],
        slideCounter: document.getElementById('slide-current'),
        aboutToggle: document.getElementById('about-toggle'),
        aboutMore: document.getElementById('about-more'),
        aboutToggleText: document.getElementById('about-toggle-text'),
        testimonialsTrack: document.getElementById('testimonials-track'),
        testimonialsPrev: document.getElementById('testimonials-prev'),
        testimonialsNext: document.getElementById('testimonials-next'),
        backToTop: document.getElementById('back-to-top'),
        cursor: document.getElementById('cursor')
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let state = {
        currentHeroSlide: 0,
        heroInterval: null,
        isMenuOpen: false,
        scrollPosition: 0
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // LOADER
    // ═══════════════════════════════════════════════════════════════════════════
    function initLoader() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    if (elements.loader) {
                        elements.loader.classList.add('hidden');
                    }
                }, 300);
            }
            if (elements.loaderBar) {
                elements.loaderBar.style.width = progress + '%';
            }
        }, 100);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HERO CAROUSEL
    // ═══════════════════════════════════════════════════════════════════════════
    function initHeroCarousel() {
        // Clear any existing hero images array
        elements.heroImages = [];

        // Get the hero background container
        const heroBackground = document.querySelector('.hero__background');
        if (!heroBackground) {
            console.warn('Hero background container not found');
            return;
        }

        // Remove existing hero image divs (except overlay)
        const existingImages = heroBackground.querySelectorAll('.hero__image');
        existingImages.forEach(img => img.remove());

        // Create hero image divs for all images in CONFIG
        CONFIG.heroImages.forEach((imagePath, index) => {
            const div = document.createElement('div');
            div.className = 'hero__image';
            div.id = 'hero-image-' + (index + 1);
            div.style.backgroundImage = `url('${imagePath}')`;

            // Insert before the overlay
            const overlay = heroBackground.querySelector('.hero__overlay');
            if (overlay) {
                heroBackground.insertBefore(div, overlay);
            } else {
                heroBackground.appendChild(div);
            }

            elements.heroImages.push(div);
        });

        if (elements.heroImages.length === 0) {
            console.warn('No hero images found');
            return;
        }

        // Set initial active slide immediately
        elements.heroImages[0].classList.add('active');

        // Update counter display
        if (elements.slideCounter) {
            elements.slideCounter.textContent = '01';
        }

        // Update total counter
        const totalCounter = document.querySelector('.hero__counter-total');
        if (totalCounter) {
            totalCounter.textContent = '/ ' + String(elements.heroImages.length).padStart(2, '0');
        }

        // Start carousel auto-rotation
        if (state.heroInterval) {
            clearInterval(state.heroInterval);
        }
        state.heroInterval = setInterval(nextHeroSlide, CONFIG.heroInterval);
    }

    function nextHeroSlide() {
        const prevIndex = state.currentHeroSlide;
        state.currentHeroSlide = (state.currentHeroSlide + 1) % elements.heroImages.length;

        elements.heroImages[prevIndex].classList.remove('active');
        elements.heroImages[state.currentHeroSlide].classList.add('active');

        // Update counter
        if (elements.slideCounter) {
            elements.slideCounter.textContent = String(state.currentHeroSlide + 1).padStart(2, '0');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER SCROLL EFFECT
    // ═══════════════════════════════════════════════════════════════════════════
    function initHeaderScroll() {
        function updateHeader() {
            if (window.scrollY > CONFIG.scrollThreshold) {
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
        elements.mobileNavClose?.addEventListener('click', () => {
            closeMenu();
        });

        // Close menu when clicking overlay
        elements.mobileNavOverlay?.addEventListener('click', () => {
            closeMenu();
        });

        // Close menu when clicking links
        const mobileLinks = elements.mobileNav.querySelectorAll('.mobile-nav__link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
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

        // Focus management: move focus to close button when menu opens
        if (state.isMenuOpen) {
            elements.mobileNavClose?.focus();
        }
    }

    function closeMenu() {
        state.isMenuOpen = false;
        elements.hamburger?.classList.remove('active');
        elements.mobileNav?.classList.remove('active');
        elements.mobileNavOverlay?.classList.remove('active');
        document.body.style.overflow = '';

        // Update ARIA attributes for accessibility
        elements.hamburger?.setAttribute('aria-expanded', 'false');
        elements.hamburger?.setAttribute('aria-label', 'פתח תפריט ניווט');
        elements.mobileNav?.setAttribute('aria-hidden', 'true');
        elements.mobileNavOverlay?.setAttribute('aria-hidden', 'true');

        // Return focus to hamburger button
        elements.hamburger?.focus();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ABOUT SECTION - READ MORE
    // ═══════════════════════════════════════════════════════════════════════════
    function initAboutToggle() {
        if (!elements.aboutToggle || !elements.aboutMore) return;

        elements.aboutToggle.addEventListener('click', () => {
            const isExpanded = elements.aboutMore.classList.contains('show');
            elements.aboutMore.classList.toggle('show');

            // Update ARIA expanded state for accessibility
            elements.aboutToggle.setAttribute('aria-expanded', !isExpanded);

            if (elements.aboutToggleText) {
                elements.aboutToggleText.textContent = isExpanded ? 'קרא עוד' : 'הצג פחות';
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TESTIMONIALS CAROUSEL
    // ═══════════════════════════════════════════════════════════════════════════
    function initTestimonialsCarousel() {
        if (!elements.testimonialsTrack) return;

        const scrollAmount = 400;

        elements.testimonialsPrev?.addEventListener('click', () => {
            elements.testimonialsTrack.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        elements.testimonialsNext?.addEventListener('click', () => {
            elements.testimonialsTrack.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        // Enable drag scrolling
        let isDown = false;
        let startX;
        let scrollLeft;

        elements.testimonialsTrack.addEventListener('mousedown', (e) => {
            isDown = true;
            elements.testimonialsTrack.style.cursor = 'grabbing';
            startX = e.pageX - elements.testimonialsTrack.offsetLeft;
            scrollLeft = elements.testimonialsTrack.scrollLeft;
        });

        elements.testimonialsTrack.addEventListener('mouseleave', () => {
            isDown = false;
            elements.testimonialsTrack.style.cursor = 'grab';
        });

        elements.testimonialsTrack.addEventListener('mouseup', () => {
            isDown = false;
            elements.testimonialsTrack.style.cursor = 'grab';
        });

        elements.testimonialsTrack.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - elements.testimonialsTrack.offsetLeft;
            const walk = (x - startX) * 2;
            elements.testimonialsTrack.scrollLeft = scrollLeft - walk;
        });

        elements.testimonialsTrack.style.cursor = 'grab';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCROLL REVEAL ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');

        if (revealElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: CONFIG.revealThreshold,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
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
    // CUSTOM CURSOR (Desktop Only)
    // ═══════════════════════════════════════════════════════════════════════════
    function initCustomCursor() {
        if (!elements.cursor || window.matchMedia('(hover: none)').matches) return;

        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            const dx = mouseX - cursorX;
            const dy = mouseY - cursorY;

            cursorX += dx * 0.15;
            cursorY += dy * 0.15;

            elements.cursor.style.transform = `translate(${cursorX - 4}px, ${cursorY - 4}px)`;

            requestAnimationFrame(animateCursor);
        }

        animateCursor();

        // Expand cursor on interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .project-card, .gallery__item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                elements.cursor.classList.add('cursor--expanded');
            });
            el.addEventListener('mouseleave', () => {
                elements.cursor.classList.remove('cursor--expanded');
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ═══════════════════════════════════════════════════════════════════════════
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerHeight = elements.header?.offsetHeight || 80;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARALLAX EFFECTS
    // ═══════════════════════════════════════════════════════════════════════════
    function initParallax() {
        const heroContent = document.querySelector('.hero__content');
        if (!heroContent) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
            }
        }, { passive: true });
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
    // LOAD DYNAMIC CONTENT
    // ═══════════════════════════════════════════════════════════════════════════
    async function loadContent() {
        if (!CONFIG.useDynamicContent) return;

        try {
            const [contentRes, galleriesRes] = await Promise.all([
                fetch('/api/content'),
                fetch('/api/galleries')
            ]);

            if (contentRes.ok) {
                siteContent = await contentRes.json();
                updatePageContent();
            }
            if (galleriesRes.ok) {
                galleries = await galleriesRes.json();
                updateGalleries();
            }
        } catch (error) {
            console.log('Running in static mode - API not available');
        }
    }

    function updatePageContent() {
        if (!siteContent) return;

        // Update Logo throughout the site
        if (siteContent.logo) {
            const logo = siteContent.logo;

            // Helper to format path - handles both local paths and Cloudinary URLs
            const formatPath = (path) => {
                if (!path) return '';
                // If it's a full URL (Cloudinary), return as-is
                if (path.startsWith('http://') || path.startsWith('https://')) {
                    return path;
                }
                // For local paths, ensure starts with /
                return path.startsWith('/') ? path : '/' + path;
            };

            // Update all main logo images
            if (logo.main) {
                document.querySelectorAll('[data-logo="main"]').forEach(img => {
                    img.src = formatPath(logo.main);
                });
            }

            // Update favicon
            if (logo.favicon) {
                const favicon = document.getElementById('favicon');
                if (favicon) {
                    favicon.href = formatPath(logo.favicon);
                }
            } else if (logo.main) {
                // Use main logo as favicon if no favicon is set
                const favicon = document.getElementById('favicon');
                if (favicon) {
                    favicon.href = formatPath(logo.main);
                }
            }
        }

        // Update Hero Section
        if (siteContent.hero) {
            const hero = siteContent.hero;

            // Update hero text
            const heroSubtitle = document.querySelector('.hero__subtitle');
            const heroTitle = document.querySelector('.hero__title');
            const heroDescription = document.querySelector('.hero__description');
            const heroCta = document.querySelector('.hero__cta .btn span');

            if (heroSubtitle) heroSubtitle.textContent = hero.subtitle;
            if (heroTitle && hero.title) {
                heroTitle.innerHTML = hero.title.map(t => `<span>${t}</span>`).join('');
            }
            if (heroDescription) heroDescription.textContent = hero.description;
            if (heroCta) heroCta.textContent = hero.ctaText;

            // Update hero images if provided
            if (hero.images && hero.images.length > 0) {
                // Format paths - handles both local and Cloudinary URLs
                CONFIG.heroImages = hero.images.map(img => {
                    const path = img.path;
                    // If it's a full URL (Cloudinary), return as-is
                    if (path.startsWith('http://') || path.startsWith('https://')) {
                        return path;
                    }
                    // For local paths, ensure starts with /
                    return path.startsWith('/') ? path : '/' + path;
                });
            }
        }

        // Update About Section
        if (siteContent.about) {
            const about = siteContent.about;

            const aboutLabel = document.querySelector('.about__label');
            const aboutTitle = document.querySelector('.about__title');
            const aboutLead = document.querySelector('.about__lead');
            const aboutText = document.querySelector('.about__text');
            const aboutMore = document.getElementById('about-more');
            const aboutImage = document.querySelector('.about__image');

            if (aboutLabel) aboutLabel.textContent = about.label;
            if (aboutTitle) aboutTitle.textContent = about.title;
            if (aboutLead) aboutLead.textContent = about.lead;
            if (aboutText) aboutText.textContent = about.text;
            if (aboutMore && about.moreText) {
                aboutMore.innerHTML = about.moreText.replace(/\\n/g, '<br>');
            }
            if (aboutImage && about.image) {
                // Handle both local and Cloudinary URLs
                aboutImage.src = about.image.startsWith('http') ? about.image : '/' + about.image;
            }

            // Update stats
            if (about.stats) {
                const statNumbers = document.querySelectorAll('.about__stat-number');
                const statLabels = document.querySelectorAll('.about__stat-label');

                about.stats.forEach((stat, i) => {
                    if (statNumbers[i]) statNumbers[i].textContent = stat.number;
                    if (statLabels[i]) statLabels[i].textContent = stat.label;
                });
            }
        }

        // Update Quotes
        if (siteContent.quotes && siteContent.quotes.length > 0) {
            const quoteSections = document.querySelectorAll('.quote-section');
            quoteSections.forEach((section, i) => {
                if (siteContent.quotes[i]) {
                    const quoteText = section.querySelector('.quote-section__text');
                    const quoteAuthor = section.querySelector('.quote-section__author');

                    if (quoteText) quoteText.textContent = siteContent.quotes[i].text;
                    if (quoteAuthor) quoteAuthor.textContent = siteContent.quotes[i].author;
                }
            });
        }

        // Update Testimonials
        if (siteContent.testimonials && siteContent.testimonials.length > 0) {
            const track = document.getElementById('testimonials-track');
            if (track) {
                track.innerHTML = siteContent.testimonials.filter(t => t.isActive).map(t => `
                    <div class="testimonial-card">
                        <span class="testimonial-card__quote-icon">"</span>
                        <p class="testimonial-card__text" data-full-text="${escapeHtml(t.text)}">
                            ${escapeHtml(t.shortText || t.text)}
                        </p>
                        <div class="testimonial-card__author">
                            <div class="testimonial-card__author-avatar">${t.authorInitial}</div>
                            <div>
                                <p class="testimonial-card__author-name">${escapeHtml(t.authorName)}</p>
                                <p class="testimonial-card__author-role">${escapeHtml(t.authorRole)}</p>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Re-init carousel after updating
                initTestimonialsCarousel();
            }
        }

        // Update Contact Section
        if (siteContent.contact) {
            const contact = siteContent.contact;

            const contactLabel = document.querySelector('.contact__label');
            const contactTitle = document.querySelector('.contact__title');
            const contactDescription = document.querySelector('.contact__description');
            const contactVisualText = document.querySelector('.contact__visual-text');

            if (contactLabel) contactLabel.textContent = contact.label;
            if (contactTitle) contactTitle.textContent = contact.title;
            if (contactDescription) contactDescription.textContent = contact.description;
            if (contactVisualText && contact.visualText) {
                contactVisualText.innerHTML = contact.visualText.replace(/\\n/g, '<br>');
            }

            // Update contact methods
            const whatsappLink = document.querySelector('.contact-method[href*="wa.me"]');
            const phoneLink = document.querySelector('.contact-method[href^="tel:"]');
            const emailLink = document.querySelector('.contact-method[href^="mailto:"]');

            if (whatsappLink) {
                whatsappLink.href = `https://wa.me/${contact.whatsapp}`;
                const val = whatsappLink.querySelector('.contact-method__value');
                if (val) val.textContent = contact.whatsappDisplay;
            }
            if (phoneLink) {
                phoneLink.href = `tel:${contact.phone}`;
                const val = phoneLink.querySelector('.contact-method__value');
                if (val) val.textContent = contact.phoneDisplay;
            }
            if (emailLink) {
                emailLink.href = `mailto:${contact.email}`;
                const val = emailLink.querySelector('.contact-method__value');
                if (val) val.textContent = contact.email;
            }
        }

        // Update Footer
        if (siteContent.footer) {
            const footer = siteContent.footer;

            const footerTagline = document.querySelector('.footer__tagline');
            const footerCopyright = document.querySelector('.footer__copyright');
            const footerCredit = document.querySelector('.footer__credit a');

            if (footerTagline) footerTagline.textContent = footer.tagline;
            if (footerCopyright) footerCopyright.textContent = footer.copyright;
            if (footerCredit) {
                footerCredit.textContent = footer.creditName;
                footerCredit.href = `tel:${footer.creditPhone}`;
            }
        }
    }

    function updateGalleries() {
        if (!galleries || galleries.length === 0) return;

        const projectsGrid = document.querySelector('.projects__grid');
        if (!projectsGrid) return;

        // Get featured galleries only
        const featured = galleries.filter(g => g.isFeatured && g.isActive);

        if (featured.length === 0) return;

        // Helper to format image path - handles both local and Cloudinary URLs
        const formatImagePath = (path) => {
            if (!path) return '';
            if (path.startsWith('http://') || path.startsWith('https://')) {
                return path;
            }
            return path.startsWith('/') ? path : '/' + path;
        };

        // All galleries now use the dynamic route /gallery/{id}
        projectsGrid.innerHTML = featured.map((gallery, i) => `
            <a href="/gallery/${gallery.id}" class="project-card reveal reveal-delay-${(i % 4) + 1}">
                <img src="${formatImagePath(gallery.coverImage)}" alt="${escapeHtml(gallery.name)}" class="project-card__image">
                <div class="project-card__overlay"></div>
                <div class="project-card__content">
                    <p class="project-card__category">${escapeHtml(gallery.category)}</p>
                    <h3 class="project-card__title">${escapeHtml(gallery.name)}</h3>
                    <p class="project-card__count">${gallery.images?.length || 0} תמונות</p>
                </div>
                <div class="project-card__arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M7 17L17 7M17 7H7M17 7V17"/>
                    </svg>
                </div>
            </a>
        `).join('');

        // Re-observe for scroll reveal
        initScrollReveal();
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════════════════
    async function init() {
        // Start loader
        initLoader();

        // Load dynamic content if available
        await loadContent();

        // Initialize all components
        function initAllComponents() {
            initHeroCarousel();
            initHeaderScroll();
            initMobileNav();
            initAboutToggle();
            initTestimonialsCarousel();
            initScrollReveal();
            initBackToTop();
            initCustomCursor();
            initSmoothScroll();
            initParallax();
        }

        // Check if page is already loaded
        if (document.readyState === 'complete') {
            initAllComponents();
        } else {
            window.addEventListener('load', initAllComponents);
        }
    }

    // Start the application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
