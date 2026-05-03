/**
 * LEAH BUDIK ARCHITECTURE - Dynamic Frontend (Redesigned)
 * Loads content + galleries from API and renders into the new design
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    function escapeHTML(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el && value != null && value !== '') el.textContent = value;
    }

    function setHTML(id, value) {
        const el = document.getElementById(id);
        if (el && value != null) el.innerHTML = value;
    }

    function setAttr(id, attr, value) {
        const el = document.getElementById(id);
        if (el && value) el.setAttribute(attr, value);
    }

    async function fetchJSON(url) {
        try {
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('Fetch failed:', url, err);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Renderers
    // ─────────────────────────────────────────────────────────────────────

    function renderHero(content) {
        if (!content) return;
        const hero = content.hero || {};

        if (hero.subtitle) setText('heroEyebrow', hero.subtitle);

        // Side text (vertical, left side)
        if (hero.sideText) setText('heroSide', hero.sideText);

        // Mega text (giant background watermark)
        if (hero.megaText) setText('heroMega', hero.megaText);

        // Title can be array of lines, or single string
        if (Array.isArray(hero.title) && hero.title.length > 0) {
            const line1 = hero.title[0] || '';
            const line2 = hero.title[1] || '';
            const highlight = hero.titleHighlight || '';

            // Apply highlight word styling if found
            let line2HTML = escapeHTML(line2);
            if (highlight && line2.includes(highlight)) {
                const parts = line2.split(highlight);
                line2HTML = parts.map(escapeHTML).join(`<span class="ital">${escapeHTML(highlight)}</span>`);
            }

            const titleEl = document.getElementById('heroTitle');
            if (titleEl) {
                titleEl.innerHTML = `
                    <span class="line1">${escapeHTML(line1)}</span>
                    ${line2 ? `<span class="line2">${line2HTML}</span>` : ''}
                `;
            }
        }

        // Tagline
        if (hero.tagline || hero.description) {
            const tagline = hero.tagline || hero.description;
            setText('heroTagline', tagline);
        }

        // CTA
        if (hero.ctaText) setText('heroCtaText', hero.ctaText);

        // Hero background image (use first hero image if available)
        if (hero.images && hero.images.length > 0) {
            const heroBg = document.getElementById('heroBg');
            if (heroBg) {
                const img = document.createElement('img');
                img.alt = '';
                img.className = 'hero-bg__image';
                img.loading = 'eager';
                img.decoding = 'async';
                img.addEventListener('load', () => {
                    heroBg.classList.add('has-image');
                    requestAnimationFrame(() => img.classList.add('active'));
                }, { once: true });
                img.addEventListener('error', () => {
                    console.warn('Hero image failed to load:', hero.images[0].path);
                    img.remove();
                }, { once: true });
                img.src = hero.images[0].path;
                heroBg.insertBefore(img, heroBg.firstChild);
            }
        }
    }

    function renderLogo(content) {
        if (!content || !content.logo) return;
        const logo = content.logo;

        if (logo.main) {
            // Replace text brand with image
            const navBrand = document.getElementById('navBrandText');
            if (navBrand) {
                navBrand.outerHTML = `<img src="${escapeHTML(logo.main)}" alt="לאה בודיק" />`;
            }
            const footerBrand = document.getElementById('footerBrand');
            if (footerBrand) {
                footerBrand.outerHTML = `<img src="${escapeHTML(logo.main)}" alt="לאה בודיק" style="height: 28px; display: inline-block; vertical-align: middle;" />`;
            }
        }

        if (logo.favicon) {
            const favicon = document.getElementById('favicon');
            if (favicon) favicon.href = logo.favicon;
        }
    }

    function renderAbout(content) {
        if (!content || !content.about) return;
        const about = content.about;

        if (about.label) setText('aboutLabel', about.label);

        // Title rendering with multi-line support and last-word italic gold
        const titleEl = document.getElementById('aboutTitle');
        if (titleEl) {
            // Priority order:
            // 1. titleLines array (preferred for new design)
            // 2. about.title with HTML tags (raw HTML)
            // 3. about.title with newlines (split into lines)
            // 4. about.title plain (single line, italic last word)
            if (Array.isArray(about.titleLines) && about.titleLines.filter(Boolean).length > 0) {
                const lines = about.titleLines.filter(Boolean);
                titleEl.innerHTML = lines.map((line, i) => {
                    const isLast = i === lines.length - 1;
                    if (isLast) {
                        // Italic gold the last word of the last line
                        const words = line.trim().split(/\s+/);
                        if (words.length > 1) {
                            const last = words.pop();
                            return `${escapeHTML(words.join(' '))} <span class="ital">${escapeHTML(last)}</span>`;
                        }
                        return `<span class="ital">${escapeHTML(line)}</span>`;
                    }
                    return escapeHTML(line);
                }).join('<br>');
            } else if (about.title) {
                if (about.title.includes('<')) {
                    titleEl.innerHTML = about.title;
                } else if (about.title.includes('\n')) {
                    const lines = about.title.split('\n').filter(Boolean);
                    titleEl.innerHTML = lines.map((line, i) => {
                        const isLast = i === lines.length - 1;
                        if (isLast) {
                            const words = line.trim().split(/\s+/);
                            if (words.length > 1) {
                                const last = words.pop();
                                return `${escapeHTML(words.join(' '))} <span class="ital">${escapeHTML(last)}</span>`;
                            }
                            return `<span class="ital">${escapeHTML(line)}</span>`;
                        }
                        return escapeHTML(line);
                    }).join('<br>');
                } else {
                    titleEl.textContent = about.title;
                }
            }
        }

        if (about.text) setText('aboutText', about.text);
        if (about.moreText) setText('aboutMoreText', about.moreText);
        if (!about.moreText) {
            const more = document.getElementById('aboutMoreText');
            if (more) more.style.display = 'none';
        }

        if (about.signature) setText('aboutSig', about.signature);
        if (about.signatureRole) setText('aboutSigMeta', about.signatureRole);

        // About image
        if (about.image) {
            const imgEl = document.getElementById('aboutImage');
            if (imgEl) {
                const img = document.createElement('img');
                img.alt = about.label || 'לאה בודיק';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.addEventListener('load', () => imgEl.classList.add('has-image'), { once: true });
                img.addEventListener('error', () => {
                    console.warn('About image failed to load:', about.image);
                    img.remove();
                }, { once: true });
                img.src = about.image;
                imgEl.appendChild(img);
            }
        }

        // Stats
        const statsEl = document.getElementById('statsGrid');
        if (statsEl && Array.isArray(about.stats) && about.stats.length > 0) {
            statsEl.innerHTML = about.stats.map((s, i) => {
                const num = String(s.number || '');
                // Detect plus/percent suffix and style it
                const match = num.match(/^([\d.]+)\s*([+%٪]?)$/);
                let numHTML;
                if (match) {
                    const base = match[1];
                    const suffix = match[2];
                    numHTML = `${escapeHTML(base)}${suffix ? `<span class="plus">${escapeHTML(suffix)}</span>` : ''}`;
                } else {
                    numHTML = escapeHTML(num);
                }
                return `
                    <div class="stat">
                        <span class="idx">— ${String(i + 1).padStart(2, '0')}</span>
                        <span class="num">${numHTML}</span>
                        <span class="lbl">${escapeHTML(s.label || '')}</span>
                    </div>
                `;
            }).join('');
        } else if (statsEl) {
            // Hide if no stats
            statsEl.style.display = 'none';
        }
    }

    function renderMarquee(content) {
        const trackEl = document.getElementById('marqueeTrack');
        if (!trackEl) return;

        let items = (content && content.marquee && Array.isArray(content.marquee.items))
            ? content.marquee.items.filter(s => s && s.trim())
            : [];

        // Default fallback
        if (items.length === 0) {
            items = ['Residential', 'Penthouse', 'Villa', 'Kitchen', 'Bath', 'Bedroom'];
        }

        // Build the track (duplicated for seamless loop)
        const buildItems = (list) => list.map((item, i) => {
            const isFill = i % 2 === 1;
            return `<span class="${isFill ? 'fill' : ''}">${escapeHTML(item)}</span><span class="dot">●</span>`;
        }).join('');

        trackEl.innerHTML = buildItems(items) + buildItems(items);
    }

    function renderProjects(content, galleries) {
        const gridEl = document.getElementById('projectsGrid');
        const filtersEl = document.getElementById('projectsFilters');
        const countEl = document.getElementById('projectsCount');
        const labelEl = document.getElementById('projectsLabel');
        const titleEl = document.getElementById('projectsTitle');
        if (!gridEl) return;

        // Editable section header
        if (content && content.projects) {
            if (content.projects.label) setText('projectsLabel', content.projects.label);
            if (content.projects.title && titleEl) {
                // Title is "פרויקטים נבחרים" - render with last word italic gold
                const t = content.projects.title.trim();
                const words = t.split(/\s+/);
                if (words.length > 1) {
                    const last = words.pop();
                    titleEl.innerHTML = `
                        <span class="big-num" id="projectsCount">${countEl ? countEl.textContent : '00'}</span>
                        <span class="head-line">${escapeHTML(words.join(' '))}</span>
                        <span class="head-line ital">${escapeHTML(last)}</span>
                    `;
                }
            }
        }

        const list = Array.isArray(galleries)
            ? galleries.filter(g => g.isActive !== false)
            : [];

        // Re-grab countEl since titleEl rebuild may have replaced it
        const countEl2 = document.getElementById('projectsCount');
        if (countEl2) {
            countEl2.textContent = String(list.length).padStart(2, '0');
        }

        if (list.length === 0) {
            gridEl.innerHTML = '<div class="empty-state">בקרוב פרויקטים חדשים</div>';
            // Hide filters if no projects
            if (filtersEl) filtersEl.style.display = 'none';
            return;
        }

        // Build filter buttons from unique categories
        if (filtersEl) {
            const cats = (content && Array.isArray(content.categories) && content.categories.length > 0)
                ? content.categories
                : Array.from(new Set(list.map(g => g.category).filter(Boolean)))
                    .map(c => ({ key: c, label: c }));

            const filterHTML = `<button data-filter="all" class="active">הכל</button>` +
                cats.map(c => `<button data-filter="${escapeHTML(c.key)}">${escapeHTML(c.label)}</button>`).join('');
            filtersEl.innerHTML = filterHTML;
        }

        // Patterns of layouts: tall, wide, regular, regular, tall, regular...
        const layouts = ['tall', 'wide', 'wide', 'tall', '', ''];
        const archVariants = ['arch-1', 'arch-2', 'arch-3', 'arch-4', 'arch-5', 'arch-6'];

        gridEl.innerHTML = list.map((g, i) => {
            const layout = layouts[i % layouts.length];
            const arch = archVariants[i % archVariants.length];
            const cover = g.coverImage || (g.images && g.images[0] && g.images[0].path);
            const num = String(i + 1).padStart(2, '0');
            const total = String(list.length).padStart(2, '0');
            const meta = g.images && g.images.length ? `${g.images.length} תמונות` : '';
            const cat = g.category || '';
            const safeId = encodeURIComponent(g.id || '');
            const link = `/gallery/${safeId}`;

            // NOTE: do NOT add `has-image` here yet — we add it after the
            // image successfully loads (see the load handler below). This
            // keeps the placeholder gradient + name visible while loading
            // (or forever, if the image is broken).
            return `
                <article class="project match ${layout}" data-cat="${escapeHTML(cat)}">
                    <a href="${link}" class="project-media" aria-label="${escapeHTML(g.name || 'פרויקט')}">
                        <div class="imgph ${arch}" data-imgph>
                            ${cover ? `<img src="${escapeHTML(cover)}" alt="${escapeHTML(g.name || '')}" loading="lazy" decoding="async" data-cover-img>` : ''}
                            <span class="ph-label">${escapeHTML(g.name || '')}</span>
                        </div>
                        <div class="project-media-overlay" aria-hidden="true"></div>
                        <div class="project-num">${num} / ${total}</div>
                        ${cat ? `<div class="project-cat">${escapeHTML(cat)}</div>` : ''}
                        <div class="project-view">לצפייה בפרויקט</div>
                    </a>
                    <div class="project-info">
                        <div class="project-title">${escapeHTML(g.name || '')}</div>
                        ${meta ? `<div class="project-meta">${escapeHTML(meta)}</div>` : ''}
                    </div>
                </article>
            `;
        }).join('');

        // Promote `has-image` only when the image actually loads. If it errors,
        // remove the broken <img> so the placeholder gradient + name stay visible.
        gridEl.querySelectorAll('img[data-cover-img]').forEach((img) => {
            const ph = img.closest('[data-imgph]');
            const finish = (ok) => {
                if (!ph) return;
                if (ok) ph.classList.add('has-image');
                else img.remove();
            };
            if (img.complete && img.naturalWidth > 0) {
                finish(true);
            } else if (img.complete) {
                finish(false);
            } else {
                img.addEventListener('load', () => finish(true), { once: true });
                img.addEventListener('error', () => {
                    console.warn('Cover image failed to load:', img.src);
                    finish(false);
                }, { once: true });
            }
        });

        // Wire up filter buttons
        if (filtersEl) {
            filtersEl.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-filter]');
                if (!btn) return;
                filtersEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
                const f = btn.dataset.filter;
                const items = gridEl.querySelectorAll('.project');
                if (f === 'all') {
                    gridEl.classList.remove('filtering');
                    items.forEach(i => i.classList.add('match'));
                } else {
                    gridEl.classList.add('filtering');
                    items.forEach(i => i.classList.toggle('match', i.dataset.cat === f));
                }
            });
        }
    }

    function renderTestimonials(content, testimonials) {
        const gridEl = document.getElementById('testiGrid');
        const titleEl = document.getElementById('testimonialsTitle');
        const markEl = document.getElementById('testiMark');

        // Editable section header (always render, even if no testimonials)
        const sections = (content && content.sections) || {};
        if (sections.testimonialsLabel && markEl) {
            markEl.textContent = sections.testimonialsLabel;
        }
        if (sections.testimonialsTitle && titleEl) {
            const t = sections.testimonialsTitle.trim();
            // Render with last word italic gold
            const words = t.split(/\s+/);
            if (words.length > 1) {
                const last = words.pop();
                titleEl.innerHTML = `${escapeHTML(words.join(' '))} <span class="ital">${escapeHTML(last)}</span>`;
            } else {
                titleEl.textContent = t;
            }
        }

        if (!gridEl) return;

        // Get testimonials from either dedicated array or content.testimonials
        let items = testimonials || (content && content.testimonials) || [];
        items = items.filter(t => t && t.isActive !== false && (t.text || t.shortText));

        if (items.length === 0) {
            // Show friendly placeholder instead of hiding the whole section
            gridEl.innerHTML = '<div class="empty-state" style="grid-column: 1/-1">בקרוב המלצות לקוחות</div>';
            return;
        }

        gridEl.innerHTML = items.map((t, i) => `
            <div class="testi reveal${i > 0 ? ' delay-' + Math.min(i + 1, 3) : ''}">
                <div class="quote-mark" aria-hidden="true">״</div>
                <p class="quote">${escapeHTML(t.text || t.shortText || '')}</p>
                <div class="author">
                    <span class="name">${escapeHTML(t.authorName || '')}</span>
                    ${t.authorRole ? `<span class="role">${escapeHTML(t.authorRole)}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    function renderContact(content) {
        if (!content || !content.contact) return;
        const c = content.contact;

        if (c.label) setText('contactLabel', c.label);
        if (c.title) {
            if (c.title.includes('<')) setHTML('contactTitle', c.title);
            else setText('contactTitle', c.title);
        }
        if (c.description) setText('contactLede', c.description);
        if (c.ctaText) setText('contactCta', c.ctaText);

        // Build channels
        const channelsEl = document.getElementById('contactChannels');
        if (!channelsEl) return;

        const channels = [];
        if (c.phone) {
            channels.push({
                label: 'טלפון',
                value: c.phoneDisplay || c.phone,
                href: `tel:${c.phone.replace(/[^\d+]/g, '')}`,
                ico: '☏'
            });
        }
        if (c.whatsapp) {
            const num = c.whatsapp.replace(/[^\d]/g, '');
            channels.push({
                label: 'WhatsApp',
                value: c.whatsappDisplay || c.whatsapp,
                href: `https://wa.me/${num}`,
                ico: '✉',
                external: true
            });
        }
        if (c.email) {
            channels.push({
                label: 'אימייל',
                value: c.email,
                href: `mailto:${c.email}`,
                ico: '@'
            });
        }
        if (c.address) {
            channels.push({
                label: c.addressLabel || 'סטודיו',
                value: c.address,
                href: '#',
                ico: '⌖'
            });
        }

        // Set CTA href
        const ctaEl = document.getElementById('contactCta');
        if (ctaEl) {
            if (c.whatsapp) {
                const num = c.whatsapp.replace(/[^\d]/g, '');
                ctaEl.href = `https://wa.me/${num}`;
                ctaEl.setAttribute('rel', 'noopener noreferrer');
                ctaEl.setAttribute('target', '_blank');
            } else if (c.phone) {
                ctaEl.href = `tel:${c.phone.replace(/[^\d+]/g, '')}`;
            }
        }

        if (channels.length > 0) {
            channelsEl.innerHTML = channels.map(ch => `
                <a class="channel" href="${escapeHTML(ch.href)}"${ch.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
                    <div class="channel-meta">
                        <span class="lbl">${escapeHTML(ch.label)}</span>
                        <span class="val">${escapeHTML(ch.value)}</span>
                    </div>
                    <span class="ico" aria-hidden="true">${ch.ico}</span>
                </a>
            `).join('');
        } else {
            channelsEl.style.display = 'none';
        }
    }

    function renderFooter(content) {
        if (!content) return;
        const footer = content.footer || {};

        if (footer.copyright) setText('footerCopyright', footer.copyright);

        const creditsEl = document.getElementById('footerCredits');
        if (creditsEl) {
            const socials = Array.isArray(footer.socials) ? footer.socials.filter(s => s && s.url && s.name) : [];
            if (socials.length > 0) {
                creditsEl.innerHTML = socials.map(s =>
                    `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.name)}</a>`
                ).join('');
            } else {
                creditsEl.innerHTML = '';
            }
        }

        // Update CTA labels from content if available
        if (content.contact && content.contact.ctaText) {
            const navCta = document.getElementById('navCta');
            if (navCta) navCta.textContent = content.contact.ctaText;
            const drawerCta = document.getElementById('mobileDrawerCta');
            if (drawerCta) drawerCta.textContent = content.contact.ctaText;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Behaviors (nav, drawer, scroll, reveal, smooth scroll)
    // ─────────────────────────────────────────────────────────────────────

    function initNav() {
        const nav = document.getElementById('nav');
        if (!nav) return;
        const onScroll = () => {
            if (window.scrollY > 24) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function initMobileDrawer() {
        const burger = document.getElementById('navBurger');
        const drawer = document.getElementById('mobileDrawer');
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
        const toggle = () => {
            if (drawer.classList.contains('open')) close();
            else open();
        };

        burger.addEventListener('click', toggle);
        drawer.addEventListener('click', (e) => {
            if (e.target.closest('[data-drawer-close]')) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('open')) close();
        });
        // Close on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900 && drawer.classList.contains('open')) close();
        });
    }

    function initRevealOnScroll() {
        const els = document.querySelectorAll('.reveal:not(.in)');
        if (!('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach(el => io.observe(el));
    }

    function initSmoothScroll() {
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const id = a.getAttribute('href');
            if (id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const y = target.getBoundingClientRect().top + window.scrollY - 60;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    }

    function initHeroParallax() {
        const heroBg = document.getElementById('heroBg');
        if (!heroBg) return;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = Math.min(window.scrollY, 800);
                heroBg.style.transform = `translateY(${y * 0.15}px)`;
                ticking = false;
            });
        }, { passive: true });
    }

    function hideLoader() {
        const loader = document.getElementById('siteLoader');
        if (loader) {
            setTimeout(() => loader.classList.add('hidden'), 100);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Boot
    // ─────────────────────────────────────────────────────────────────────

    async function boot() {
        // Set up behaviors first - these don't depend on data
        initNav();
        initMobileDrawer();
        initSmoothScroll();
        initHeroParallax();

        // Fetch data in parallel
        const [content, galleries] = await Promise.all([
            fetchJSON('/api/content'),
            fetchJSON('/api/galleries')
        ]);

        // Render everything (each renderer is defensive)
        try { renderLogo(content); } catch (e) { console.error('Logo render failed:', e); }
        try { renderHero(content); } catch (e) { console.error('Hero render failed:', e); }
        try { renderAbout(content); } catch (e) { console.error('About render failed:', e); }
        try { renderMarquee(content); } catch (e) { console.error('Marquee render failed:', e); }
        try { renderProjects(content, galleries); } catch (e) { console.error('Projects render failed:', e); }
        try { renderTestimonials(content); } catch (e) { console.error('Testimonials render failed:', e); }
        try { renderContact(content); } catch (e) { console.error('Contact render failed:', e); }
        try { renderFooter(content); } catch (e) { console.error('Footer render failed:', e); }

        // Initialize reveal AFTER content is rendered (new elements have .reveal class)
        requestAnimationFrame(() => {
            initRevealOnScroll();
            hideLoader();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
