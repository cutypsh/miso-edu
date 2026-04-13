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

function printSlides() {
    window.print();
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
