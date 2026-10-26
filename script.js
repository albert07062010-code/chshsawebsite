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

// Google Sheets 連結
const API_URLS = {
    news: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSubOQ7OEhEkolArIpxom1kTHbAOipGnNV-7GVTaamcPzUxG2qYN705AQK_uBLDFJMBIL6-HovaEzK-/pub?output=csv",
    history: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7gWoroJbHYGWLpxI9cxJ8p0dZw6VGV2KcE5SWzWm2TTePi_UzbkXjGowxayUaSRXlzgkYv51FQFm3/pub?output=csv",
    rules: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUu6HM7pvEz7j4eY_86VXoyDQYzTIogbK53riy6kBlrn77OhlrwoB5fDvOIOqozdbnIWbIEHJSWBtV/pub?output=csv",
    links: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPdelpqcTIYFL3gZUE5hXzycKADyoOFCiOQ0qF2ni5dDsmrY90V5Kz1ogrAL5Xtm6zFluh6kL15LJp/pub?output=csv"
};

let globalNewsData = []; 

function fetchCsvData(url, containerId, loadingMsg, onSuccess) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<p style="text-align:center; color:#666; padding: 2rem; font-weight: 700;">${loadingMsg}...</p>`;

    Papa.parse(url, {
        download: true,
        header: true,
        complete: results => onSuccess(results.data, container),
        error: err => {
            container.innerHTML = `
                <div style="text-align:center; padding: 3rem 1rem;">
                    <p style="color:#E24A45; margin-bottom: 1rem; font-weight: 700;">無法載入資料，請檢查網路連線。</p>
                    <button onclick="location.reload()" style="padding: 8px 20px; border: none; background: var(--brand-navy); color: var(--white); border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: background 0.3s;">重新載入頁面</button>
                </div>
            `;
        }
    });
}

function loadNews() {
    fetchCsvData(API_URLS.news, 'news-container', '公告資料同步中', (data, container) => {
        globalNewsData = data.filter(news => news.title && news.title.trim() !== "");
        
        if (globalNewsData.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; padding: 2rem;">目前沒有最新公告。</p>';
            return;
        }

        container.innerHTML = globalNewsData.map((news, index) => `
            <a href="#" class="news-item" onclick="openNewsModal(${index}, event)">
                <div class="news-meta">
                    <span class="news-date">${escapeHTML(news.date)}</span>
                    <span class="news-tag ${escapeHTML(news.tagClass) || 'tag-general'}">${escapeHTML(news.category) || '公告'}</span>
                </div>
                <h3 class="news-title">${escapeHTML(news.title)}</h3>
                <div class="news-arrow">→</div>
            </a>
        `).join('');
    });
}

function loadHistory() {
    fetchCsvData(API_URLS.history, 'history-container', '歷屆會史載入中', (data, container) => {
        const validData = data.filter(row => row.term && row.term.trim() !== "");
        
        if (validData.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; padding: 2rem;">目前沒有會史資料。</p>';
            return;
        }

        container.innerHTML = validData.map(item => `
            <div class="timeline-item">
                <div class="timeline-year">${escapeHTML(item.semester).split('-')[0]} 學年度 第 ${escapeHTML(item.semester).split('-')[1]} 學期</div>
                <div class="timeline-content">
                    <div class="timeline-badge">第 ${escapeHTML(item.term)} 屆</div>
                    <h3>彰中學生會</h3>
                    <p class="history-leaders">會長：${escapeHTML(item.president)} / 副會長：${escapeHTML(item.vice_president)}</p>
                    <div class="tag-cloud" style="margin-top: 0.8rem;">
                        ${item.pr ? `<span class="pill-tag">公關：${escapeHTML(item.pr)}</span>` : ''}
                        ${item.activity ? `<span class="pill-tag">活動：${escapeHTML(item.activity)}</span>` : ''}
                        ${item.rights ? `<span class="pill-tag">學權：${escapeHTML(item.rights)}</span>` : ''}
                        ${item.club ? `<span class="pill-tag">社發：${escapeHTML(item.club)}</span>` : ''}
                        ${item.promo ? `<span class="pill-tag">文宣：${escapeHTML(item.promo)}</span>` : ''}
                        ${item.general ? `<span class="pill-tag">總務：${escapeHTML(item.general)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    });
}

function loadRules() {
    fetchCsvData(API_URLS.rules, 'rules-container', '法規資料同步中', (data, container) => {
        const validData = data.filter(row => row.title && row.title.trim() !== "");
        
        if (validData.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; padding: 2rem;">目前沒有法規資料。</p>';
            return;
        }

        container.innerHTML = validData.map(rule => {
            const category = (rule.category || '').trim();
            let tagClass = 'tag-general', tagName = '未分類';
            
            if (category === 'school') {
                tagClass = 'tag-school';
                tagName = '學校校規';
            } else if (category === 'sa') {
                tagClass = 'tag-sa';
                tagName = '自治法規';
            }
            
            const summaryHTML = rule.summary 
                ? escapeHTML(rule.summary).split('\n').filter(l => l.trim()).map(l => `<p>${l.trim()}</p>`).join('')
                : '';

            const safePdfUrl = safeUrl(rule.pdfUrl);
            const linkHTML = safePdfUrl
                ? `<a href="${safePdfUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; margin-top: 1.2rem; padding: 10px 20px; background:var(--brand-navy); color:#fff; text-decoration:none; border-radius:6px; font-weight:700; font-size:0.95rem;">🔗 開啟完整法規文件 ↗</a>` 
                : `<span style="color:#94A3B8; font-size:0.9rem; margin-top:1.2rem; display:inline-block;">（目前尚無法規連結）</span>`;

            return `
                <div class="rule-card" data-category="${escapeHTML(category)}">
                    <div class="rule-header" onclick="toggleRule(this)">
                        <div class="rule-title-group">
                            <span class="rule-tag ${tagClass}">${tagName}</span>
                            <h3>${escapeHTML(rule.title)}</h3>
                        </div>
                        <span class="toggle-icon">+</span>
                    </div>
                    <div class="rule-body">
                        <div class="rule-meta">
                            <span>最後修訂日期：${escapeHTML(rule.updated) || '未知'}</span>
                        </div>
                        <div class="rule-content">
                            ${summaryHTML}
                            ${linkHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML += `<div id="no-rules-msg" class="no-results-msg">找不到相符的法規，請嘗試其他關鍵字。</div>`;
        filterRules();
    });
}

function loadLinks() {
    const container = document.getElementById('links-container');
    if (!container) return;

    if (API_URLS.links && !API_URLS.links.includes("YOUR_")) {
        fetchCsvData(API_URLS.links, 'links-container', '相關連結載入中', (data, c) => {
            const validData = data.filter(item => item.title && item.title.trim() !== "");
            renderLinks(validData, c);
        });
    } else {
        const defaultLinks = [
            { title: "國立彰化高級中學 官方網站", category: "校方資源", description: "國立彰化高級中學官方全球資訊網。", url: "https://www.chsh.chc.edu.tw/" },
            { title: "國立彰化高級中學 學生會 IG", category: "學生自治", description: "彰中學生會官方 Instagram 帳號。", url: "https://www.instagram.com/_chsh.sa.78th_/" },
            { title: "彰中學生意見申訴 Google 表單", category: "學權管道", description: "全校同學反映校務建議、學權申訴與建言的線上匿名表單入口。", url: "https://docs.google.com/forms/d/1Y_vE4giGK-6P9Y6eh4Firj1QZC9NDqJoJjJDMKzjLZ4/viewform" }
        ];
        renderLinks(defaultLinks, container);
    }
}

function renderLinks(data, container) {
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding: 2rem;">目前沒有相關連結。</p>';
        return;
    }

    container.innerHTML = data.map(item => `
        <a href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer" class="link-card">
            <div>
                <div class="link-card-header">
                    <span class="link-tag">${escapeHTML(item.category || '一般連結')}</span>
                    <span class="link-card-arrow">↗</span>
                </div>
                <h3>${escapeHTML(item.title)}</h3>
                <p>${escapeHTML(item.description)}</p>
            </div>
        </a>
    `).join('');
}

// ----------------------------------------------------
// 使用者條款彈跳視窗邏輯
// ----------------------------------------------------
function initTermsModal() {
    const termsModal = document.getElementById("terms-modal");
    const btnAgree = document.getElementById("btn-terms-agree");
    const btnDisagree = document.getElementById("btn-terms-disagree");

    if (!termsModal) return;

    // 檢查瀏覽器是否已同意
    if (!localStorage.getItem("chshsa_terms_accepted")) {
        // 設定 2800 毫秒 (2.8秒) 延遲，等預設的白色 Loading 完全消失後再彈出
        setTimeout(() => {
            termsModal.classList.add("active");
        }, 2800);
    }

    // 點擊「同意」
    if (btnAgree) {
        btnAgree.addEventListener("click", () => {
            localStorage.setItem("chshsa_terms_accepted", "true");
            termsModal.classList.remove("active");
        });
    }

    // 點擊「不同意」跳轉卡加布列島
    if (btnDisagree) {
        btnDisagree.addEventListener("click", () => {
            window.location.href = "https://www.youtube.com/watch?v=acBsZstdFHw&list=RDacBsZstdFHw&start_radio=1";
        });
    }
}

// ----------------------------------------------------
// 初始化執行區
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    loadHistory();
    loadRules();
    loadLinks();
    initTermsModal(); // 啟動條款視窗檢查
});

const mobileMenuBtn = document.getElementById('mobile-menu');
const mainNav = document.getElementById('main-nav');

if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('open');
        mainNav.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (mobileMenuBtn.classList.contains('open')) {
            if (!mainNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('open');
                mainNav.classList.remove('open');
            }
        }
    });
}

const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page-section');
let currentIndex = 0;
let isAnimating = false;
    
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        if (this.getAttribute('href') === 'club.html' || this.getAttribute('href') === '/clubs' || this.getAttribute('href') === 'clubs/') {
            e.preventDefault();
            document.body.style.transition = 'opacity 0.4s ease';
            document.body.style.opacity = '0';
            setTimeout(() => window.location.href = this.getAttribute('href'), 400);
            return;
        }
        
        if (window.innerWidth <= 992 && mobileMenuBtn && mainNav) {
            mobileMenuBtn.classList.remove('open');
            mainNav.classList.remove('open');
        }

        if (isAnimating) return;
        
        const indexValue = parseInt(this.getAttribute('data-index'));
        if (!isNaN(indexValue)) {
            navigateTo(indexValue);
        }
    });
});

function navigateTo(targetIndex) {
    if (isNaN(targetIndex) || targetIndex === currentIndex) return;
    isAnimating = true;

    const currentDoc = pages[currentIndex];
    const targetDoc = pages[targetIndex];
    const direction = targetIndex > currentIndex ? 'right' : 'left';
    
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-index="${targetIndex}"]`);
    if (activeLink) activeLink.classList.add('active');

    targetDoc.style.transition = 'none';
    targetDoc.className = `page-section ${direction === 'right' ? 'page-hidden-right' : 'page-hidden-left'}`;
    void targetDoc.offsetWidth; 

    targetDoc.style.transition = 'transform 0.6s cubic-bezier(0.77, 0, 0.175, 1), visibility 0.6s';
    currentDoc.className = `page-section ${direction === 'right' ? 'page-hidden-left' : 'page-hidden-right'}`;
    targetDoc.className = 'page-section page-active';

    currentIndex = targetIndex;
    
    const backToTopBtn = document.getElementById('back-to-top');
    if(backToTopBtn) backToTopBtn.classList.remove('show');
    
    setTimeout(() => {
        isAnimating = false;
        currentDoc.scrollTop = 0; 
    }, 600);
}

function openNewsModal(index, event) {
    event.preventDefault(); 
    const news = globalNewsData[index];
    
    document.getElementById('modal-date').textContent = news.date || '';
    document.getElementById('modal-tag').textContent = news.category || '公告';
    document.getElementById('modal-tag').className = `news-tag ${escapeHTML(news.tagClass) || 'tag-general'}`;
    document.getElementById('modal-title').textContent = news.title;
    
    let bodyHTML = news.content ? `<div>${escapeHTML(news.content).replace(/\n/g, '<br>')}</div>` : '';
    
    const safeNewsLink = safeUrl(news.link);
    if (safeNewsLink) {
        bodyHTML += `
            <div style="margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px dashed var(--border-color);">
                <a href="${safeNewsLink}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:8px; padding:12px 24px; background:var(--brand-navy); color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:0.95rem;">
                    🔗 開啟相關連結 / 附件 ↗
                </a>
            </div>
        `;
    }
    
    document.getElementById('modal-body').innerHTML = bodyHTML || '<p style="color:#94A3B8;">（此公告無詳細內文與連結）</p>';
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.getElementById('news-modal').classList.add('active');
        });
    });
}

function closeNewsModal(event) {
    if (event.target.id === 'news-modal' || event.target.classList.contains('modal-close')) {
        document.getElementById('news-modal').classList.remove('active');
        setTimeout(() => document.body.style.overflow = '', 300);
    }
}

let currentRuleCategory = 'all';

function switchRuleTab(category, btnElement) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    currentRuleCategory = category;
    filterRules();
}

function filterRules() {
    const keyword = document.getElementById('rule-search-input').value.toLowerCase();
    let visibleCount = 0;
    
    document.querySelectorAll('.rule-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        const cardCategory = card.getAttribute('data-category');
        const matchCategory = (currentRuleCategory === 'all' || cardCategory === currentRuleCategory);
        const matchKeyword = text.includes(keyword);
        
        if (matchCategory && matchKeyword) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noRulesMsg = document.getElementById('no-rules-msg');
    if (noRulesMsg) {
        noRulesMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function toggleRule(headerElement) {
    headerElement.parentElement.classList.toggle('open');
}

window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('loaded');
            setTimeout(() => preloader.remove(), 600); 
        }, 2000);
    }
});

const backToTopBtn = document.getElementById('back-to-top');

if (backToTopBtn) {
    pages.forEach(page => {
        page.addEventListener('scroll', function() {
            if (this.classList.contains('page-active')) {
                if (this.scrollTop > 300) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            }
        });
    });

    backToTopBtn.addEventListener('click', () => {
        const activePage = document.querySelector('.page-active');
        if (activePage) {
            activePage.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
}
