let currentSlide = 0;
const slides = document.querySelectorAll('.slide-wrapper');
let currentScale = 1;
const counter = document.getElementById('slide-counter');
const prevButton = document.getElementById('prev-slide');
const nextButton = document.getElementById('next-slide');
const printButton = document.getElementById('print-slides');
const fullscreenButton = document.getElementById('fullscreen-toggle');

// ── 슬라이드 이동 ─────────────────────────────────
function showSlide(index) {
    if (index < 0) index = 0;
    else if (index >= slides.length) index = slides.length - 1;
    currentSlide = index;

    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentSlide);
        slide.setAttribute('aria-hidden', i === currentSlide ? 'false' : 'true');
    });

    updateNavState();
    applySlideTransforms();
}

function nextSlide() { showSlide(currentSlide + 1); }
function prevSlide() { showSlide(currentSlide - 1); }

function getInitialSlideFromHash() {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) return 0;

    const match = hash.match(/^(?:slide-?)?(\d{1,2})$/i);
    if (!match) return 0;

    const requested = Number.parseInt(match[1], 10);
    if (Number.isNaN(requested)) return 0;
    return Math.min(Math.max(requested, 0), slides.length - 1);
}

// ── 화면 자동 스케일 ─────────────────────────────
function applySlideTransforms() {
    const W = 1122, H = 794; // A4 landscape
    const isMobile = window.innerWidth < 900;
    const navHeight = document.querySelector('.nav-controls')?.offsetHeight ?? 0;
    const gutterX = isMobile ? 12 : 40;
    const topGutter = isMobile ? 16 : 28;
    const bottomGutter = isMobile ? navHeight + 22 : navHeight + 34;
    const availableWidth = Math.max(window.innerWidth - gutterX * 2, 320);
    const availableHeight = Math.max(window.innerHeight - topGutter - bottomGutter, 320);
    const fit = Math.min(availableWidth / W, availableHeight / H);
    currentScale = fit * 0.98;
    const offsetY = (topGutter - bottomGutter) / 2;

    slides.forEach((slide, i) => {
        const slideScale = i === currentSlide ? currentScale : currentScale * 0.97;
        slide.style.transform = `translate(-50%, calc(-50% + ${offsetY}px)) scale(${slideScale})`;
    });
}

function fitToScreen() {
    applySlideTransforms();
}

function updateNavState() {
    if (counter) {
        const contentSlides = Math.max(slides.length - 1, 0);
        counter.textContent = currentSlide === 0
            ? `표지 / ${contentSlides}`
            : `${currentSlide} / ${contentSlides}`;
    }
    if (prevButton) prevButton.disabled = currentSlide === 0;
    if (nextButton) nextButton.disabled = currentSlide === slides.length - 1;
}

// ── 전체 화면 ───────────────────────────────────
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen?.();
    }
}

// ── 인쇄 전/후 처리 ──────────────────────────────────────────────────────────
// Chrome의 인쇄 엔진은 @media print CSS보다 먼저 레이아웃을 캡처하는 경우가 있어
// beforeprint 단독으로는 불완전함. 세 가지 방법을 동시에 사용.

function injectPrintStyles() {
    if (document.getElementById('print-anim-override')) return;

    // ① <style> 태그 주입 (CSS @media print 보완)
    const style = document.createElement('style');
    style.id = 'print-anim-override';
    style.textContent = `
        *, *::before, *::after {
            animation-delay: -9999s !important;
            animation-duration: 0.001s !important;
            animation-fill-mode: both !important;
            animation-play-state: paused !important;
            transition: none !important;
        }
        .slide-wrapper, .slide-wrapper *, .slide-wrapper *::before, .slide-wrapper *::after {
            transition: none !important;
            will-change: auto !important;
        }
        [class*="anim-"], .anim-1, .anim-2, .anim-3, .anim-4, .anim-5, .anim-fade,
        .active .anim-1, .active .anim-2, .active .anim-3,
        .active .anim-4, .active .anim-5, .active .anim-fade {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
        }
        .content-area { overflow: visible !important; }
        .abstract-bg, .hero-bg {
            mix-blend-mode: normal !important;
            animation: none !important;
            transform: none !important;
            filter: none !important;
        }
        .abstract-bg { opacity: 0.08 !important; }
        .hero-bg { opacity: 0.42 !important; }
        .section-card, .stat-card, .highlight-panel, .process-step,
        .process-number, .qa-card, .contact-panel, .idx-box {
            box-shadow: none !important;
            filter: none !important;
        }
        .hero-heading {
            -webkit-text-fill-color: white !important;
            background: none !important;
            -webkit-background-clip: unset !important;
            background-clip: unset !important;
            color: white !important;
        }
        .hero-kicker       { color: #c8a04a !important; }
        .hero-subcopy      { display: block !important; opacity: 1 !important;
                             backdrop-filter: none !important;
                             -webkit-backdrop-filter: none !important; }
        .hero-subcopy p    { color: rgba(255,255,255,0.92) !important; }
        .hero-tags         { display: flex !important; flex-wrap: wrap !important; opacity: 1 !important; }
        .hero-tag          { display: inline-flex !important; opacity: 1 !important;
                             backdrop-filter: none !important;
                             -webkit-backdrop-filter: none !important;
                             color: rgba(255,255,255,0.92) !important;
                             background: rgba(255,255,255,0.15) !important; }
        .presenter-line    { display: flex !important; opacity: 1 !important;
                             color: rgba(255,255,255,0.85) !important; }
        .presenter-line .name { color: white !important; }
        .slide-wrapper .slide-footer { opacity: 1 !important; }
        .slide-wrapper::before { opacity: 1 !important; }
        .dynamic-orbs, .dynamic-particles, .light-sweeps, .golden-dust { display: none !important; }
    `;
    document.head.appendChild(style);

    // ② 직접 인라인 스타일 조작 (가장 높은 우선순위 — CSS 캐스케이드 완전 우회)
    document.querySelectorAll('[class*="anim-"]').forEach(el => {
        el.style.setProperty('opacity',     '1',    'important');
        el.style.setProperty('transform',   'none', 'important');
        el.style.setProperty('visibility',  'visible', 'important');
        el.style.setProperty('animation-delay', '-9999s', 'important');
        el.style.setProperty('animation-play-state', 'paused', 'important');
    });

    // ③ 히어로 특정 요소 직접 처리
    const heroHeading = document.querySelector('.hero-heading');
    if (heroHeading) {
        heroHeading.style.setProperty('-webkit-text-fill-color', 'white', 'important');
        heroHeading.style.setProperty('background', 'none', 'important');
        heroHeading.style.setProperty('color', 'white', 'important');
    }
    ['hero-subcopy', 'hero-tags', 'presenter-line'].forEach(cls => {
        const el = document.querySelector('.' + cls);
        if (el) {
            el.style.setProperty('opacity', '1', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
        }
    });
}

function removePrintStyles() {
    const style = document.getElementById('print-anim-override');
    if (style) style.remove();

    // 인라인 스타일 제거 (일반 브라우저 뷰 복원)
    document.querySelectorAll('[class*="anim-"]').forEach(el => {
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        el.style.removeProperty('visibility');
        el.style.removeProperty('animation-delay');
        el.style.removeProperty('animation-play-state');
    });
    const heroHeading = document.querySelector('.hero-heading');
    if (heroHeading) {
        heroHeading.style.removeProperty('-webkit-text-fill-color');
        heroHeading.style.removeProperty('background');
        heroHeading.style.removeProperty('color');
    }
    ['hero-subcopy', 'hero-tags', 'presenter-line'].forEach(cls => {
        const el = document.querySelector('.' + cls);
        if (el) {
            el.style.removeProperty('opacity');
            el.style.removeProperty('visibility');
        }
    });
}

// 방법① beforeprint 이벤트
window.addEventListener('beforeprint', injectPrintStyles);
window.addEventListener('afterprint',  removePrintStyles);

// 방법② matchMedia — Chrome에서 beforeprint보다 신뢰성 높음
const printMQ = window.matchMedia('print');
const printMQHandler = (e) => { e.matches ? injectPrintStyles() : removePrintStyles(); };
if (printMQ.addEventListener) {
    printMQ.addEventListener('change', printMQHandler);
} else if (printMQ.addListener) {
    printMQ.addListener(printMQHandler); // 구형 브라우저 폴백
}

function printSlides() {
    injectPrintStyles(); // 직접 호출 시 즉시 적용
    void document.body.offsetHeight; // 강제 리플로우로 인쇄 직전 스타일 적용 보장
    requestAnimationFrame(() => setTimeout(() => window.print(), 120));
}

// ── 이벤트 바인딩 ────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch(e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
            e.preventDefault();
            nextSlide();
            break;
        case 'ArrowLeft':
        case 'PageUp':
            e.preventDefault();
            prevSlide();
            break;
        case 'f':
        case 'F':
            toggleFullScreen();
            break;
        case 'Escape': /* 브라우저 기본 ESC 동작 허용 */ break;
    }
});

// 터치 스와이프 지원 (모바일)
let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
        dx < 0 ? nextSlide() : prevSlide();
    }
}, { passive: true });

prevButton?.addEventListener('click', prevSlide);
nextButton?.addEventListener('click', nextSlide);
printButton?.addEventListener('click', printSlides);
fullscreenButton?.addEventListener('click', toggleFullScreen);

window.addEventListener('resize', fitToScreen);

// ── 초기 로드 ────────────────────────────────────
showSlide(getInitialSlideFromHash());
