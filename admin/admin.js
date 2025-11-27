/**
 * LEAH BUDIK - ADMIN PANEL
 * Complete admin dashboard functionality
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let state = {
        content: null,
        galleries: [],
        currentGalleryId: null
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', async () => {
        await loadAllData();
        setupNavigation();
        setupMobileMenu();
        setupLogout();
        renderDashboard();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════════════════════════
    async function loadAllData() {
        showLoading();
        try {
            const [contentRes, galleriesRes] = await Promise.all([
                fetch('/api/content'),
                fetch('/api/galleries')
            ]);

            if (contentRes.ok) {
                state.content = await contentRes.json();
            }
            if (galleriesRes.ok) {
                state.galleries = await galleriesRes.json();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('error', 'שגיאה בטעינת הנתונים');
        }
        hideLoading();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════
    function setupNavigation() {
        document.querySelectorAll('.sidebar__link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                showSection(section);
                closeMobileMenu();
            });
        });
    }

    window.showSection = function(sectionId) {
        // Update nav
        document.querySelectorAll('.sidebar__link[data-section]').forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        // Update sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === `section-${sectionId}`);
        });

        // Close gallery edit panel when leaving galleries
        if (sectionId !== 'galleries') {
            const editPanel = document.getElementById('gallery-edit-panel');
            if (editPanel) editPanel.style.display = 'none';
        }

        // Render section
        switch (sectionId) {
            case 'dashboard': renderDashboard(); break;
            case 'logo': renderLogo(); break;
            case 'hero': renderHero(); break;
            case 'about': renderAbout(); break;
            case 'galleries': renderGalleries(); break;
            case 'testimonials': renderTestimonials(); break;
            case 'contact': renderContact(); break;
            case 'quotes': renderQuotes(); break;
            case 'footer': renderFooter(); break;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MOBILE MENU
    // ═══════════════════════════════════════════════════════════════════════════
    function setupMobileMenu() {
        const toggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');

        toggle?.addEventListener('click', () => {
            sidebar?.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar?.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !toggle?.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }

    function closeMobileMenu() {
        document.getElementById('sidebar')?.classList.remove('open');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOGOUT
    // ═══════════════════════════════════════════════════════════════════════════
    function setupLogout() {
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (e) {}
            window.location.href = '/admin/login';
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════════
    function renderDashboard() {
        const galleriesCount = document.getElementById('galleries-count');
        const testimonialsCount = document.getElementById('testimonials-count');
        const heroCount = document.getElementById('hero-count');

        if (galleriesCount) galleriesCount.textContent = state.galleries.length;
        if (testimonialsCount) testimonialsCount.textContent = state.content?.testimonials?.length || 0;
        if (heroCount) heroCount.textContent = state.content?.hero?.images?.length || 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: LOGO
    // ═══════════════════════════════════════════════════════════════════════════
    // Helper to format image path - handles both local paths and Cloudinary URLs
    function formatPath(path) {
        if (!path) return '';
        // If it's already a full URL (Cloudinary), return as-is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        // For local paths, ensure starts with /
        return path.startsWith('/') ? path : '/' + path;
    }

    function renderLogo() {
        const logo = state.content?.logo || {};

        // Main logo
        const mainImg = document.getElementById('main-logo-img');
        const mainEmpty = document.getElementById('main-logo-empty');
        const deleteMainBtn = document.getElementById('delete-main-logo');

        if (logo.main) {
            mainImg.src = formatPath(logo.main);
            mainImg.classList.add('visible');
            mainEmpty.classList.add('hidden');
            deleteMainBtn.style.display = 'flex';

            // Also update the sidebar logo
            const sidebarLogo = document.querySelector('.sidebar__logo');
            if (sidebarLogo) {
                sidebarLogo.src = formatPath(logo.main);
            }
        } else {
            mainImg.classList.remove('visible');
            mainEmpty.classList.remove('hidden');
            deleteMainBtn.style.display = 'none';
        }

        // Light logo
        const lightImg = document.getElementById('light-logo-img');
        const lightEmpty = document.getElementById('light-logo-empty');
        const deleteLightBtn = document.getElementById('delete-light-logo');

        if (logo.light) {
            lightImg.src = formatPath(logo.light);
            lightImg.classList.add('visible');
            lightEmpty.classList.add('hidden');
            deleteLightBtn.style.display = 'flex';
        } else {
            lightImg.classList.remove('visible');
            lightEmpty.classList.remove('hidden');
            deleteLightBtn.style.display = 'none';
        }

        // Favicon
        const faviconImg = document.getElementById('favicon-img');
        const faviconEmpty = document.getElementById('favicon-empty');
        const deleteFaviconBtn = document.getElementById('delete-favicon');

        if (logo.favicon) {
            faviconImg.src = formatPath(logo.favicon);
            faviconImg.classList.add('visible');
            faviconEmpty.classList.add('hidden');
            deleteFaviconBtn.style.display = 'flex';
        } else {
            faviconImg.classList.remove('visible');
            faviconEmpty.classList.remove('hidden');
            deleteFaviconBtn.style.display = 'none';
        }
    }

    window.uploadLogo = async function(type, input) {
        if (!input.files.length) return;

        showLoading();

        const formData = new FormData();
        formData.append('logo', input.files[0]);
        formData.append('type', type);

        try {
            const res = await fetch('/api/logo', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const result = await res.json();
                state.content.logo = state.content.logo || {};
                state.content.logo[type] = result.path;
                renderLogo();
                showToast('success', 'הלוגו הועלה בהצלחה');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בהעלאת הלוגו');
        }

        hideLoading();
        input.value = '';
    };

    window.deleteLogo = async function(type) {
        if (!confirm('האם למחוק את הלוגו?')) return;

        showLoading();
        try {
            const res = await fetch(`/api/logo/${type}`, { method: 'DELETE' });
            if (res.ok) {
                if (state.content.logo) {
                    delete state.content.logo[type];
                }
                renderLogo();
                showToast('success', 'הלוגו נמחק');
            }
        } catch (e) {
            showToast('error', 'שגיאה במחיקת הלוגו');
        }
        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: HERO
    // ═══════════════════════════════════════════════════════════════════════════
    function renderHero() {
        const hero = state.content?.hero || {};

        setValue('hero-subtitle', hero.subtitle);
        setValue('hero-title-1', hero.title?.[0]);
        setValue('hero-title-2', hero.title?.[1]);
        setValue('hero-description', hero.description);
        setValue('hero-cta', hero.ctaText);

        renderHeroImages();
    }

    function renderHeroImages() {
        const container = document.getElementById('hero-images-grid');
        if (!container) return;

        const images = state.content?.hero?.images || [];

        if (images.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>אין תמונות ראשיות. העלה תמונות חדשות.</p></div>';
            return;
        }

        container.innerHTML = images.map(img => `
            <div class="image-item" data-id="${img.id}">
                <img src="${formatPath(img.path)}" alt="">
                <div class="image-item__overlay">
                    <button class="btn--icon danger" onclick="deleteHeroImage('${img.id}')" title="מחק">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.saveHeroText = async function() {
        showLoading();

        const heroData = {
            subtitle: getValue('hero-subtitle'),
            title: [getValue('hero-title-1'), getValue('hero-title-2')],
            description: getValue('hero-description'),
            ctaText: getValue('hero-cta'),
            images: state.content?.hero?.images || []
        };

        try {
            const res = await fetch('/api/content/hero', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(heroData)
            });

            if (res.ok) {
                state.content.hero = heroData;
                showToast('success', 'השינויים נשמרו בהצלחה');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בשמירה');
        }

        hideLoading();
    };

    window.uploadHeroImage = async function(input) {
        if (!input.files.length) return;

        showLoading();

        for (const file of input.files) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('gallery', 'hero');

            try {
                const res = await fetch('/api/hero-images', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const newImage = await res.json();
                    state.content.hero = state.content.hero || { images: [] };
                    state.content.hero.images = state.content.hero.images || [];
                    state.content.hero.images.push(newImage);
                }
            } catch (e) {
                console.error('Upload error:', e);
            }
        }

        renderHeroImages();
        showToast('success', 'התמונות הועלו בהצלחה');
        hideLoading();
        input.value = '';
    };

    window.deleteHeroImage = async function(imageId) {
        if (!confirm('האם למחוק את התמונה?')) return;

        showLoading();
        try {
            const res = await fetch(`/api/hero-images/${imageId}`, { method: 'DELETE' });
            if (res.ok) {
                state.content.hero.images = state.content.hero.images.filter(img => img.id !== imageId);
                renderHeroImages();
                showToast('success', 'התמונה נמחקה');
            }
        } catch (e) {
            showToast('error', 'שגיאה במחיקה');
        }
        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: ABOUT
    // ═══════════════════════════════════════════════════════════════════════════
    function renderAbout() {
        const about = state.content?.about || {};

        setValue('about-label', about.label);
        setValue('about-title', about.title);
        setValue('about-lead', about.lead);
        setValue('about-text', about.text);
        setValue('about-more', about.moreText);

        if (about.stats) {
            setValue('about-stat-1-num', about.stats[0]?.number);
            setValue('about-stat-1-label', about.stats[0]?.label);
            setValue('about-stat-2-num', about.stats[1]?.number);
            setValue('about-stat-2-label', about.stats[1]?.label);
            setValue('about-stat-3-num', about.stats[2]?.number);
            setValue('about-stat-3-label', about.stats[2]?.label);
        }
    }

    window.saveAbout = async function() {
        showLoading();

        const aboutData = {
            label: getValue('about-label'),
            title: getValue('about-title'),
            lead: getValue('about-lead'),
            text: getValue('about-text'),
            moreText: getValue('about-more'),
            image: state.content?.about?.image || '',
            stats: [
                { number: getValue('about-stat-1-num'), label: getValue('about-stat-1-label') },
                { number: getValue('about-stat-2-num'), label: getValue('about-stat-2-label') },
                { number: getValue('about-stat-3-num'), label: getValue('about-stat-3-label') }
            ]
        };

        try {
            const res = await fetch('/api/content/about', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aboutData)
            });

            if (res.ok) {
                state.content.about = aboutData;
                showToast('success', 'השינויים נשמרו בהצלחה');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בשמירה');
        }

        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: GALLERIES
    // ═══════════════════════════════════════════════════════════════════════════
    function renderGalleries() {
        const container = document.getElementById('galleries-list');
        if (!container) return;

        if (state.galleries.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>אין גלריות. צור את הגלריה הראשונה.</p></div>';
            return;
        }

        container.innerHTML = state.galleries.map(g => `
            <div class="gallery-item" data-id="${g.id}">
                <div class="gallery-item__image">
                    ${g.coverImage ? `<img src="${formatPath(g.coverImage)}" alt="${g.name}">` : ''}
                </div>
                <div class="gallery-item__info">
                    <div class="gallery-item__name">${g.name}</div>
                    <div class="gallery-item__meta">
                        <span>${g.images?.length || 0} תמונות</span>
                        <span class="gallery-item__status">
                            <span class="status-dot ${g.isActive ? 'active' : ''}"></span>
                            ${g.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                    </div>
                </div>
                <div class="gallery-item__actions">
                    <a href="/gallery/${g.id}" target="_blank" class="btn--icon" title="צפה בגלריה">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </a>
                    <button class="btn btn--small btn--secondary" onclick="editGallery('${g.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        עריכה
                    </button>
                    <button class="btn--icon danger" onclick="deleteGallery('${g.id}')" title="מחק">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.showAddGalleryModal = function() {
        document.getElementById('modal-title').textContent = 'גלריה חדשה';
        document.getElementById('modal-body').innerHTML = `
            <div class="form-group">
                <label class="form-label">שם הגלריה</label>
                <input type="text" class="form-input" id="new-gallery-name" placeholder="סלונים">
            </div>
            <div class="form-group">
                <label class="form-label">קטגוריה</label>
                <input type="text" class="form-input" id="new-gallery-category" placeholder="עיצוב פנים">
            </div>
            <div class="form-group">
                <label class="form-label">תיאור</label>
                <textarea class="form-textarea" id="new-gallery-description" rows="2" placeholder="תיאור קצר של הגלריה"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label"><input type="checkbox" id="new-gallery-active" checked> גלריה פעילה</label>
                </div>
                <div class="form-group">
                    <label class="form-label"><input type="checkbox" id="new-gallery-featured"> הצג בעמוד הבית</label>
                </div>
            </div>
            <button class="btn btn--primary" onclick="createGallery()">צור גלריה</button>
        `;
        openModal();
    };

    window.createGallery = async function() {
        const name = getValue('new-gallery-name');
        if (!name) {
            showToast('error', 'נא להזין שם גלריה');
            return;
        }

        showLoading();

        const galleryData = {
            name: name,
            category: getValue('new-gallery-category'),
            description: getValue('new-gallery-description'),
            isActive: document.getElementById('new-gallery-active')?.checked || false,
            isFeatured: document.getElementById('new-gallery-featured')?.checked || false,
            folder: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
        };

        try {
            const res = await fetch('/api/galleries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(galleryData)
            });

            if (res.ok) {
                const newGallery = await res.json();
                state.galleries.push(newGallery);
                renderGalleries();
                closeModal();
                showToast('success', 'הגלריה נוצרה בהצלחה');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה ביצירת הגלריה');
        }

        hideLoading();
    };

    window.editGallery = function(galleryId) {
        const gallery = state.galleries.find(g => g.id === galleryId);
        if (!gallery) return;

        state.currentGalleryId = galleryId;

        const panel = document.getElementById('gallery-edit-panel');
        if (!panel) return;

        panel.style.display = 'block';
        document.getElementById('gallery-edit-title').textContent = `עריכת גלריה: ${gallery.name}`;
        document.getElementById('edit-gallery-id').value = gallery.id;
        setValue('edit-gallery-name', gallery.name);
        setValue('edit-gallery-category', gallery.category);
        setValue('edit-gallery-description', gallery.description);
        document.getElementById('edit-gallery-active').checked = gallery.isActive;
        document.getElementById('edit-gallery-featured').checked = gallery.isFeatured;

        renderGalleryImages(gallery);

        // Scroll to panel
        panel.scrollIntoView({ behavior: 'smooth' });
    };

    function renderGalleryImages(gallery) {
        const container = document.getElementById('gallery-images-grid');
        if (!container) return;

        const images = gallery?.images || [];

        if (images.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>אין תמונות. העלה תמונות לגלריה.</p></div>';
            return;
        }

        container.innerHTML = images.map(img => `
            <div class="image-item ${gallery.coverImage === img.path ? 'cover' : ''}" data-id="${img.id}">
                <img src="${formatPath(img.path)}" alt="">
                <div class="image-item__overlay">
                    <button class="btn--icon" onclick="setCoverImage('${gallery.id}', '${encodeURIComponent(img.path)}')" title="הגדר כתמונת כיסוי">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </button>
                    <button class="btn--icon danger" onclick="deleteGalleryImage('${gallery.id}', '${img.id}')" title="מחק">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.closeGalleryEdit = function() {
        document.getElementById('gallery-edit-panel').style.display = 'none';
        state.currentGalleryId = null;
    };

    window.saveGalleryDetails = async function() {
        const galleryId = document.getElementById('edit-gallery-id').value;
        if (!galleryId) return;

        showLoading();

        const galleryData = {
            name: getValue('edit-gallery-name'),
            category: getValue('edit-gallery-category'),
            description: getValue('edit-gallery-description'),
            isActive: document.getElementById('edit-gallery-active').checked,
            isFeatured: document.getElementById('edit-gallery-featured').checked
        };

        try {
            const res = await fetch(`/api/galleries/${galleryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(galleryData)
            });

            if (res.ok) {
                const gallery = state.galleries.find(g => g.id === galleryId);
                if (gallery) Object.assign(gallery, galleryData);
                renderGalleries();
                showToast('success', 'הגלריה עודכנה');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בעדכון');
        }

        hideLoading();
    };

    window.uploadGalleryImages = async function(input) {
        const galleryId = state.currentGalleryId;
        if (!galleryId || !input.files.length) return;

        const gallery = state.galleries.find(g => g.id === galleryId);
        if (!gallery) return;

        showLoading();

        const formData = new FormData();
        for (const file of input.files) {
            formData.append('images', file);
        }
        formData.append('gallery', gallery.folder || galleryId);

        try {
            const res = await fetch(`/api/galleries/${galleryId}/images`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const result = await res.json();
                gallery.images = gallery.images || [];
                gallery.images.push(...result.images);
                renderGalleryImages(gallery);
                renderGalleries();
                showToast('success', 'התמונות הועלו בהצלחה');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בהעלאה');
        }

        hideLoading();
        input.value = '';
    };

    window.setCoverImage = async function(galleryId, imagePath) {
        // Decode the URL-encoded path
        const decodedPath = decodeURIComponent(imagePath);
        showLoading();
        try {
            const res = await fetch(`/api/galleries/${galleryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverImage: decodedPath })
            });

            if (res.ok) {
                const gallery = state.galleries.find(g => g.id === galleryId);
                if (gallery) {
                    gallery.coverImage = decodedPath;
                    renderGalleryImages(gallery);
                    renderGalleries();
                }
                showToast('success', 'תמונת הכיסוי עודכנה');
            }
        } catch (e) {
            showToast('error', 'שגיאה בעדכון');
        }
        hideLoading();
    };

    window.deleteGalleryImage = async function(galleryId, imageId) {
        if (!confirm('האם למחוק את התמונה?')) return;

        showLoading();
        try {
            const res = await fetch(`/api/galleries/${galleryId}/images/${imageId}`, { method: 'DELETE' });
            if (res.ok) {
                const gallery = state.galleries.find(g => g.id === galleryId);
                if (gallery) {
                    gallery.images = gallery.images.filter(img => img.id !== imageId);
                    renderGalleryImages(gallery);
                    renderGalleries();
                }
                showToast('success', 'התמונה נמחקה');
            }
        } catch (e) {
            showToast('error', 'שגיאה במחיקה');
        }
        hideLoading();
    };

    window.deleteGallery = async function(galleryId) {
        if (!confirm('האם למחוק את הגלריה? פעולה זו לא ניתנת לביטול.')) return;

        showLoading();
        try {
            const res = await fetch(`/api/galleries/${galleryId}`, { method: 'DELETE' });
            if (res.ok) {
                state.galleries = state.galleries.filter(g => g.id !== galleryId);
                renderGalleries();
                closeGalleryEdit();
                showToast('success', 'הגלריה נמחקה');
            }
        } catch (e) {
            showToast('error', 'שגיאה במחיקה');
        }
        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: TESTIMONIALS
    // ═══════════════════════════════════════════════════════════════════════════
    function renderTestimonials() {
        const container = document.getElementById('testimonials-list');
        if (!container) return;

        const testimonials = state.content?.testimonials || [];

        if (testimonials.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>אין המלצות. הוסף את ההמלצה הראשונה.</p></div>';
            return;
        }

        container.innerHTML = testimonials.map(t => `
            <div class="testimonial-item" data-id="${t.id}">
                <div class="testimonial-item__header">
                    <div class="testimonial-item__author">
                        <div class="testimonial-item__avatar">${t.authorInitial || t.authorName?.charAt(0) || '?'}</div>
                        <div>
                            <div class="testimonial-item__name">${t.authorName}</div>
                            <div class="testimonial-item__role">${t.authorRole}</div>
                        </div>
                    </div>
                    <div class="testimonial-item__actions">
                        <button class="btn--icon" onclick="editTestimonial('${t.id}')" title="עריכה">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn--icon danger" onclick="deleteTestimonial('${t.id}')" title="מחק">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="testimonial-item__text">${t.shortText || t.text}</p>
            </div>
        `).join('');
    }

    window.showAddTestimonialModal = function() {
        showTestimonialModal(null);
    };

    window.editTestimonial = function(id) {
        const testimonial = state.content?.testimonials?.find(t => t.id === id);
        showTestimonialModal(testimonial);
    };

    function showTestimonialModal(testimonial) {
        const isEdit = !!testimonial;
        document.getElementById('modal-title').textContent = isEdit ? 'עריכת המלצה' : 'המלצה חדשה';
        document.getElementById('modal-body').innerHTML = `
            <input type="hidden" id="testimonial-edit-id" value="${testimonial?.id || ''}">
            <div class="form-group">
                <label class="form-label">שם הלקוח</label>
                <input type="text" class="form-input" id="testimonial-author" value="${testimonial?.authorName || ''}" placeholder="שם הלקוח">
            </div>
            <div class="form-group">
                <label class="form-label">תפקיד / תיאור</label>
                <input type="text" class="form-input" id="testimonial-role" value="${testimonial?.authorRole || 'לקוח מרוצה'}" placeholder="לקוח מרוצה">
            </div>
            <div class="form-group">
                <label class="form-label">טקסט מלא</label>
                <textarea class="form-textarea" id="testimonial-text" rows="4" placeholder="ההמלצה המלאה">${testimonial?.text || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">טקסט קצר (מוצג בקרוסלה)</label>
                <textarea class="form-textarea" id="testimonial-short" rows="2" placeholder="גרסה מקוצרת להצגה">${testimonial?.shortText || ''}</textarea>
            </div>
            <button class="btn btn--primary" onclick="saveTestimonial()">${isEdit ? 'שמור שינויים' : 'הוסף המלצה'}</button>
        `;
        openModal();
    }

    window.saveTestimonial = async function() {
        const id = getValue('testimonial-edit-id');
        const authorName = getValue('testimonial-author');

        if (!authorName) {
            showToast('error', 'נא להזין שם לקוח');
            return;
        }

        showLoading();

        const data = {
            authorName: authorName,
            authorInitial: authorName.charAt(0),
            authorRole: getValue('testimonial-role') || 'לקוח מרוצה',
            text: getValue('testimonial-text'),
            shortText: getValue('testimonial-short'),
            isActive: true
        };

        try {
            let res;
            if (id) {
                res = await fetch(`/api/testimonials/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                res = await fetch('/api/testimonials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (res.ok) {
                await loadAllData();
                renderTestimonials();
                renderDashboard();
                closeModal();
                showToast('success', id ? 'ההמלצה עודכנה' : 'ההמלצה נוספה');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בשמירה');
        }

        hideLoading();
    };

    window.deleteTestimonial = async function(id) {
        if (!confirm('האם למחוק את ההמלצה?')) return;

        showLoading();
        try {
            const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadAllData();
                renderTestimonials();
                renderDashboard();
                showToast('success', 'ההמלצה נמחקה');
            }
        } catch (e) {
            showToast('error', 'שגיאה במחיקה');
        }
        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: CONTACT
    // ═══════════════════════════════════════════════════════════════════════════
    function renderContact() {
        const contact = state.content?.contact || {};

        setValue('contact-label', contact.label);
        setValue('contact-title', contact.title);
        setValue('contact-description', contact.description);
        setValue('contact-whatsapp', contact.whatsapp);
        setValue('contact-whatsapp-display', contact.whatsappDisplay);
        setValue('contact-phone', contact.phone);
        setValue('contact-phone-display', contact.phoneDisplay);
        setValue('contact-email', contact.email);
        setValue('contact-visual', contact.visualText?.replace(/\\n/g, '\n'));
    }

    window.saveContact = async function() {
        showLoading();

        const data = {
            label: getValue('contact-label'),
            title: getValue('contact-title'),
            description: getValue('contact-description'),
            whatsapp: getValue('contact-whatsapp'),
            whatsappDisplay: getValue('contact-whatsapp-display'),
            phone: getValue('contact-phone'),
            phoneDisplay: getValue('contact-phone-display'),
            email: getValue('contact-email'),
            visualText: getValue('contact-visual')?.replace(/\n/g, '\\n')
        };

        try {
            const res = await fetch('/api/content/contact', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                state.content.contact = data;
                showToast('success', 'השינויים נשמרו');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בשמירה');
        }

        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: QUOTES
    // ═══════════════════════════════════════════════════════════════════════════
    function renderQuotes() {
        const quotes = state.content?.quotes || [];

        setValue('quote-1-text', quotes[0]?.text);
        setValue('quote-1-author', quotes[0]?.author);
        setValue('quote-2-text', quotes[1]?.text);
        setValue('quote-2-author', quotes[1]?.author);
    }

    window.saveQuotes = async function() {
        showLoading();

        const quotes = [
            { id: state.content?.quotes?.[0]?.id || 'quote-1', text: getValue('quote-1-text'), author: getValue('quote-1-author') },
            { id: state.content?.quotes?.[1]?.id || 'quote-2', text: getValue('quote-2-text'), author: getValue('quote-2-author') }
        ];

        try {
            const res = await fetch('/api/content/quotes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quotes)
            });

            if (res.ok) {
                state.content.quotes = quotes;
                showToast('success', 'הציטוטים נשמרו');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בשמירה');
        }

        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: FOOTER
    // ═══════════════════════════════════════════════════════════════════════════
    function renderFooter() {
        const footer = state.content?.footer || {};

        setValue('footer-tagline', footer.tagline);
        setValue('footer-copyright', footer.copyright);
        setValue('footer-credit-name', footer.creditName);
        setValue('footer-credit-phone', footer.creditPhone);
    }

    window.saveFooter = async function() {
        showLoading();

        const data = {
            tagline: getValue('footer-tagline'),
            copyright: getValue('footer-copyright'),
            creditName: getValue('footer-credit-name'),
            creditPhone: getValue('footer-credit-phone')
        };

        try {
            const res = await fetch('/api/content/footer', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                state.content.footer = data;
                showToast('success', 'השינויים נשמרו');
            } else {
                throw new Error();
            }
        } catch (e) {
            showToast('error', 'שגיאה בשמירה');
        }

        hideLoading();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL
    // ═══════════════════════════════════════════════════════════════════════════
    function openModal() {
        document.getElementById('modal-overlay')?.classList.add('active');
    }

    window.closeModal = function() {
        document.getElementById('modal-overlay')?.classList.remove('active');
    };

    // Close modal on overlay click
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TOAST
    // ═══════════════════════════════════════════════════════════════════════════
    function showToast(type, message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');

        if (!toast || !toastMessage) return;

        toast.className = `toast ${type}`;
        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOADING
    // ═══════════════════════════════════════════════════════════════════════════
    function showLoading() {
        document.getElementById('loading')?.classList.add('active');
    }

    function hideLoading() {
        document.getElementById('loading')?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════
    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    }

})();
