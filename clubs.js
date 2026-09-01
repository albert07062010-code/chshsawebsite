function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

function safeUrl(url) {
    if (!url) return '';
    let trimmed = String(url).trim();
    if (trimmed === '' || trimmed === '#') return '';
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
    if (!/^[a-zA-Z]+:\/\//.test(trimmed) && !/^(mailto|tel):/i.test(trimmed)) {
        trimmed = 'https://' + trimmed;
    }
    return encodeURI(trimmed);
}

const CLUBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7akRmJd6kLkLVbzMjLEhjkca0KBhEOPyDMRCvQhx9Ritb_O8R8UBFwTcE7c3w0s4nnnld9bSECigi/pub?output=csv";

let allClubsData = [];
let currentCategory = 'all';
let currentSearchKeyword = '';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('clubs-container');
    if (!container) return;

    container.innerHTML = `<p style="text-align:center; color:#666; padding: 2rem; font-weight: 700;">社團資料同步中...</p>`;

    if (CLUBS_CSV_URL.includes("YOUR_")) {
        const defaultClubs = [
            {
                id: "01",
                name: "資訊研究社",
                category: "學術類",
                description: "致力於程式設計、網頁開發、資訊安全與資訊科技交流，每年參與各項競賽與聯合迎新。",
                igUrl: "https://www.instagram.com/"
            },
            {
                id: "02",
                name: "吉他社",
                category: "音樂類",
                description: "以弦音凝聚熱情，從基礎木吉他教學到成發大合奏，提供喜愛音樂的同學盡情發揮的舞台。",
                igUrl: "https://www.instagram.com/"
            }
        ];
        initClubApp(defaultClubs);
        return;
    }

    Papa.parse(CLUBS_CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            const validData = results.data.filter(item => item.name && item.name.trim() !== "");
            initClubApp(validData);
        },
        error: function(err) {
            container.innerHTML = '<p style="text-align:center; color:#E24A45; padding: 2rem;">無法載入社團資料，請檢查網路連線。</p>';
        }
    });

    // 綁定返回首頁與 Logo 的平滑淡出跳轉事件
    const backToHomeLinks = [
        document.getElementById('back-to-home-link'),
        document.getElementById('back-to-home-logo')
    ];

    backToHomeLinks.forEach(element => {
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault(); // 阻擋瞬間跳轉
                
                // 讓整個頁面淡出
                document.body.style.transition = 'opacity 0.4s ease';
                document.body.style.opacity = '0';
                
                // 0.4 秒動畫結束後正式跳回首頁
                setTimeout(() => {
                    window.location.href = '彰中.html';
                }, 400);
            });
        }
    });
});

function initClubApp(data) {
    allClubsData = data;
    setupCategories(data);
    setupSearchAndFilterEvents();
    filterAndRenderClubs();
}

function setupCategories(data) {
    const filtersContainer = document.getElementById('category-filters-container');
    if (!filtersContainer) return;

    const categories = [...new Set(data.map(item => item.category ? item.category.trim() : '其他'))].filter(Boolean);

    let buttonsHTML = `<button class="filter-btn active" data-category="all">全部社團</button>`;
    categories.forEach(cat => {
        buttonsHTML += `<button class="filter-btn" data-category="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`;
    });

    filtersContainer.innerHTML = buttonsHTML;
}

function setupSearchAndFilterEvents() {
    const searchInput = document.getElementById('club-search-input');
    const filtersContainer = document.getElementById('category-filters-container');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchKeyword = e.target.value.trim().toLowerCase();
            filterAndRenderClubs();
        });
    }

    if (filtersContainer) {
        filtersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                filtersContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                currentCategory = e.target.getAttribute('data-category');
                filterAndRenderClubs();
            }
        });
    }
}

function filterAndRenderClubs() {
    const container = document.getElementById('clubs-container');
    if (!container) return;

    const filtered = allClubsData.filter(club => {
        const clubCat = (club.category || '其他').trim();
        const matchesCategory = (currentCategory === 'all' || clubCat === currentCategory);

        const name = (club.name || '').toLowerCase();
        const desc = (club.description || '').toLowerCase();
        const id = (club.id || '').toLowerCase();
        const matchesSearch = name.includes(currentSearchKeyword) || 
                              desc.includes(currentSearchKeyword) || 
                              id.includes(currentSearchKeyword);

        return matchesCategory && matchesSearch;
    });

    renderClubs(filtered, container);
}

function renderClubs(data, container) {
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding: 3rem; grid-column: 1 / -1; font-weight: 700;">找不到符合條件的社團。</p>';
        return;
    }

    container.innerHTML = data.map((club, index) => {
        const safeLink = safeUrl(club.igUrl);
        const clubId = escapeHTML(club.id || String(index + 1).padStart(2, '0'));
        
        const delay = (index % 6) * 0.08;

        const igButtonHTML = safeLink 
            ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="club-ig-btn">
                <span class="ig-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                </span>
                <span>追蹤社團 IG</span>
            </a>`
            : '';

        return `
            <div class="club-card-item" style="transition-delay: ${delay}s;">
                <div>
                    <div class="club-card-top">
                        <span class="club-id">NO. ${clubId}</span>
                        <span class="club-category">${escapeHTML(club.category || '社團')}</span>
                    </div>
                    <h3 class="club-title">${escapeHTML(club.name)}</h3>
                    <p class="club-desc">${escapeHTML(club.description)}</p>
                </div>
                ${igButtonHTML ? `<div>${igButtonHTML}</div>` : ''}
            </div>
        `;
    }).join('');

    initScrollObserver();
}

function initScrollObserver() {
    const cards = document.querySelectorAll('.club-card-item');
    
    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observerInstance.unobserve(entry.target);
            }
        });
    }, {
        root: document.getElementById('app-container'),
        threshold: 0.15
    });

    cards.forEach(card => observer.observe(card));
}

window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('loaded');
            setTimeout(() => { preloader.remove(); }, 600); 
        }, 1000);
    }
});