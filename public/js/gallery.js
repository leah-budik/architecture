/**
 * LEAH BUDIK ARCHITECTURE - Gallery Page (Redesigned)
 * Loads single gallery + builds image grid + lightbox
 */

(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);

    function escapeHTML(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getGalleryIdFromURL() {
        const pathMatch = window.location.pathname.match(/\/gallery\/([^/?#]+)/);
        if (pathMatch) return decodeURIComponent(pathMatch[1]);
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async function fetchJSON(url) {
        try {
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.warn('Fetch failed:', url, err);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Nav (matches main site)
    // ─────────────────────────────────────────────────────────────────────
    function initNav() {
        const nav = $('#nav');
        if (!nav) return;
        const onScroll = () => {
            if (window.scrollY > 24) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function initMobileDrawer() {
        const burger = $('#navBurger');
        const drawer = $('#mobileDrawer');
        if (!burger || !drawer) return;
        const close = () => {
            drawer.classList.remove('open');
            burger.classList.remove('open');
            burger.setAttribute('aria-expanded', 'false');
            drawer.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
        };
        const open = () => {
            drawer.classList.add('open');
            burger.classList.add('open');
            burger.setAttribute('aria-expanded', 'true');
            drawer.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
        };
        burger.addEventListener('click', () => {
            if (drawer.classList.contains('open')) close();
            else open();
        });
        drawer.addEventListener('click', (e) => {
            if (e.target.closest('[data-drawer-close]')) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('open')) close();
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900 && drawer.classList.contains('open')) close();
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Lightbox
    // ─────────────────────────────────────────────────────────────────────
    let lightboxState = { images: [], index: 0, open: false };

    function openLightbox(images, index) {
        lightboxState.images = images;
        lightboxState.index = index;
        lightboxState.open = true;
        const lb = $('#lightbox');
        if (!lb) return;
        lb.classList.add('open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        renderLightboxImage();
    }

    function closeLightbox() {
        lightboxState.open = false;
        const lb = $('#lightbox');
        if (!lb) return;
        lb.classList.remove('open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    }

    function nextLightbox() {
        if (!lightboxState.images.length) return;
        lightboxState.index = (lightboxState.index + 1) % lightboxState.images.length;
        renderLightboxImage();
    }

    function prevLightbox() {
        if (!lightboxState.images.length) return;
        lightboxState.index = (lightboxState.index - 1 + lightboxState.images.length) % lightboxState.images.length;
        renderLightboxImage();
    }

    function renderLightboxImage() {
        const img = $('#lightbox-image');
        const counter = $('#lightbox-counter');
        const current = lightboxState.images[lightboxState.index];
        if (img && current) {
            img.src = current.path;
            img.alt = current.originalName || '';
        }
        if (counter) {
            counter.textContent = `${lightboxState.index + 1} / ${lightboxState.images.length}`;
        }
    }

    function initLightbox() {
        $('#lightbox-close')?.addEventListener('click', closeLightbox);
        $('#lightbox-prev')?.addEventListener('click', prevLightbox);
        $('#lightbox-next')?.addEventListener('click', nextLightbox);
        $('#lightbox')?.addEventListener('click', (e) => {
            if (e.target.id === 'lightbox') closeLightbox();
        });
        document.addEventListener('keydown', (e) => {
            if (!lightboxState.open) return;
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') nextLightbox();
            else if (e.key === 'ArrowRight') prevLightbox();
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Back to top
    // ─────────────────────────────────────────────────────────────────────
    function initBackToTop() {
        const btn = $('#back-to-top');
        if (!btn) return;
        const onScroll = () => {
            if (window.scrollY > 500) btn.classList.add('visible');
            else btn.classList.remove('visible');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        onScroll();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Footer + logo (mirror main site)
    // ─────────────────────────────────────────────────────────────────────
    async function loadSiteContent() {
        const content = await fetchJSON('/api/content');
        if (!content) return;

        const footer = content.footer || {};
        if (footer.copyright) {
            const el = $('#footerCopyright');
            if (el) el.textContent = footer.copyright;
        }

        const credits = $('#footerCredits');
        if (credits) {
            const socials = Array.isArray(footer.socials) ? footer.socials.filter(s => s && s.url && s.name) : [];
            if (socials.length > 0) {
                credits.innerHTML = socials.map(s =>
                    `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.name)}</a>`
                ).join('');
            }
        }

        if (content.logo && content.logo.main) {
            const brandText = $('#navBrandText');
            if (brandText) {
                brandText.outerHTML = `<img src="${escapeHTML(content.logo.main)}" alt="לאה בודיק" />`;
            }
        }
        if (content.logo && content.logo.favicon) {
            const fav = $('#favicon');
            if (fav) fav.href = content.logo.favicon;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Gallery render
    // ─────────────────────────────────────────────────────────────────────
    function renderError() {
        const loading = $('#gallery-loading');
        const error = $('#gallery-error');
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'flex';
    }

    function renderGallery(gallery) {
        const loading = $('#gallery-loading');
        if (loading) loading.style.display = 'none';

        const heroEl = $('#gallery-hero');
        const gridEl = $('#gallery-grid');
        if (heroEl) heroEl.style.display = 'block';
        if (gridEl) gridEl.style.display = 'grid';

        // Title - last word in italic gold
        const titleEl = $('#gallery-title');
        if (titleEl && gallery.name) {
            const words = gallery.name.trim().split(/\s+/);
            if (words.length > 1) {
                const last = words.pop();
                titleEl.innerHTML = `${escapeHTML(words.join(' '))} <span class="ital">${escapeHTML(last)}</span>`;
            } else {
                titleEl.textContent = gallery.name;
            }
        }

        document.title = `${gallery.name || 'גלריה'} | לאה בודיק`;

        const catEl = $('#gallery-category');
        if (catEl && gallery.category) catEl.textContent = gallery.category;

        const descEl = $('#gallery-description');
        if (descEl && gallery.description) {
            descEl.textContent = gallery.description;
            descEl.style.display = 'block';
        }

        const countEl = $('#gallery-count');
        const images = gallery.images || [];
        if (countEl) countEl.textContent = `${images.length} תמונות`;

        if (!gridEl) return;
        if (images.length === 0) {
            gridEl.innerHTML = '<div class="empty-state" style="grid-column: 1/-1">אין תמונות בגלריה זו</div>';
            return;
        }

        gridEl.innerHTML = images.map((img, i) => `
            <figure class="gallery-item" data-index="${i}">
                <img src="${escapeHTML(img.path)}" alt="${escapeHTML(img.originalName || gallery.name || '')}" loading="lazy" decoding="async">
                <div class="gallery-item__overlay" aria-hidden="true">
                    <span class="gallery-item__num">${String(i + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}</span>
                </div>
            </figure>
        `).join('');

        gridEl.querySelectorAll('img').forEach(img => {
            const finish = () => img.classList.add('loaded');
            if (img.complete && img.naturalWidth > 0) finish();
            else {
                img.addEventListener('load', finish, { once: true });
                img.addEventListener('error', () => img.parentElement?.remove(), { once: true });
            }
        });

        gridEl.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (!item) return;
            const idx = parseInt(item.dataset.index, 10);
            openLightbox(images, idx);
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Boot
    // ─────────────────────────────────────────────────────────────────────
    async function boot() {
        initNav();
        initMobileDrawer();
        initLightbox();
        initBackToTop();

        loadSiteContent();

        const id = getGalleryIdFromURL();
        if (!id) {
            renderError();
            return;
        }

        const gallery = await fetchJSON(`/api/galleries/${encodeURIComponent(id)}`);
        if (!gallery || gallery.error) {
            renderError();
            return;
        }
        renderGallery(gallery);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
