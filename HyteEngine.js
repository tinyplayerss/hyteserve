/**
 * HyteEngine.js - HyteServe Edition
 * Features: Automatic "NEW" Labels (Latest Date Priority), Unified Wiki/Blog Design,
 * JSON-to-UI Automation, Real-time Search, and Ad-Ready Containers.
 */

let allMods = [];
let filteredMods = [];
let activeTags = new Set();
let searchQuery = "";
let currentPage = 1;
const modsPerPage = 10;
let currentSource = 'modlist.json'; 
let newestDateInList = null; 

// --- CONFIGURATION ---
const GITHUB_REPO = "tinyplayerss/hyteserve"; 

/**
 * HELPER: Identifies the latest date in the provided array
 */
const findNewestDate = (data) => {
    if (!data || data.length === 0) return null;
    const dates = data
        .map(item => item.date ? new Date(item.date).getTime() : 0)
        .filter(time => !isNaN(time));
    return dates.length > 0 ? new Date(Math.max(...dates)) : null;
};

/**
 * HELPER: Checks if an item matches the newest date found in the list
 */
const isNew = (dateString) => {
    if (!dateString || !newestDateInList) return false;
    const itemDate = new Date(dateString).getTime();
    return itemDate === newestDateInList.getTime();
};

/**
 * Helper to animate individual counters with 10+ rounding logic
 */
const startCounterAnim = (elementId, totalValue) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    let current = 0;
    const duration = 1500;
    const stepTime = totalValue > 0 ? Math.abs(Math.floor(duration / totalValue)) : 0;

    if (totalValue === 0) { el.innerText = "0"; return; }

    const timer = setInterval(() => {
        current++;
        if (current % 10 === 0 && totalValue > current) {
            el.innerText = `${current}+`;
        } else if (current >= totalValue) {
            el.innerText = totalValue;
            clearInterval(timer);
        } else {
            el.innerText = current;
        }
    }, stepTime);
};

/**
 * Enhanced SEO function to also update UI counters
 */
async function updateSiteSEOAndCounters() {
    const sources = {
        'modlist.json': 'count-mods',
        'maplist.json': 'count-maps',
        'bloglist.json': 'count-blogs',
        'wikihytale.json': 'count-wiki'
    };

    try {
        const results = await Promise.allSettled(
            Object.keys(sources).map(url => fetch(url).then(res => res.json()))
        );

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                const url = Object.keys(sources)[index];
                const elementId = sources[url];
                const count = result.value.length;
                
                // Trigger the individual animation
                startCounterAnim(elementId, count);
            }
        });
    } catch (err) {
        console.error("Counter Engine Error:", err);
    }
}

// Ensure this runs when the page loads
document.addEventListener('DOMContentLoaded', updateSiteSEOAndCounters);

/**
 * Core Initialization
 */
const initHyteEngine = async (source = 'modlist.json') => {
    try {
        currentSource = source;
        const response = await fetch(source);
        allMods = await response.json();
        
        // Determine the newest date for the current source
        newestDateInList = findNewestDate(allMods);
        
        filteredMods = [...allMods];
        
        // --- UPDATED BRANDING LOGIC ---
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            const brand = "HYTESERVE";
            if (source === 'modlist.json') heroTitle.innerText = `${brand} MODS`;
            else if (source === 'maplist.json') heroTitle.innerText = `${brand} CUSTOM MAPS`;
            else if (source === 'bloglist.json') heroTitle.innerText = `${brand} DEV BLOG`;
            else if (source === 'wikihytale.json') heroTitle.innerText = `${brand} KNOWLEDGE WIKI`;
        }

        const filterSection = document.getElementById('filter-section');
        if (filterSection) filterSection.innerHTML = '<h4>Filter by Type</h4>';
        
        generateFilterUI();
        setupEventListeners();
        renderPage(1);
    } catch (err) {
        console.error("HyteEngine Error:", err);
    }
};

/**
 * Renders the main list view
 */
const renderPage = (page) => {
    currentPage = page;
    const mainView = document.getElementById("main-view");
    const detailsView = document.getElementById("details-view");
    if (mainView) mainView.style.display = "block";
    if (detailsView) detailsView.style.display = "none";

    const grid = document.getElementById("mod-grid");
    if (!grid) return;

    const start = (page - 1) * modsPerPage;
    const paginatedMods = filteredMods.slice(start, start + modsPerPage);

    // Identify if we should use the "Article" grid (Blog or Wiki)
    const isArticleMode = currentSource === 'wikihytale.json' || currentSource === 'bloglist.json';

    if (paginatedMods.length === 0) {
        grid.style.display = "block";
        grid.innerHTML = `<p style="text-align: center; padding: 50px;">No items found.</p>`;
    } else if (isArticleMode) {
        // --- RESTORED ORIGINAL WIKI & BLOG DESIGN (Grid Layout) ---
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
        grid.style.gap = "25px";

        const groups = {};
        paginatedMods.forEach(item => {
            const g = item.group || (currentSource === 'bloglist.json' ? "Recent Updates" : "General");
            if (!groups[g]) groups[g] = [];
            groups[g].push(item);
        });

        grid.innerHTML = Object.keys(groups).map(groupName => `
            <div class="wiki-group-wrapper" style="grid-column: 1/-1; margin-bottom: 50px;">
                <h2 class="wiki-group-title" style="color:#f3ae32; border-bottom: 2px solid #3d4d5e; padding-bottom: 10px; margin-bottom: 25px; font-size: 1.8rem;">${groupName.toUpperCase()}</h2>
                <div class="wiki-sub-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px;">
                    ${groups[groupName].map(item => {
                        const originalIndex = allMods.indexOf(item);
                        const isRecent = isNew(item.date);
                        return `
                            <div class="wiki-article-card" onclick="showDetails(${originalIndex})" 
                                 style="background: #1a242d; border: 1px solid #3d4d5e; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.2s; display: flex; flex-direction: column; min-height: 420px; position: relative;">
                                ${isRecent ? `<span style="position: absolute; top: 15px; left: 15px; background: #f3ae32; color: #000; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; z-index: 5; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">NEW</span>` : ''}
                                <div class="wiki-card-image" style="width: 100%; height: 200px; overflow: hidden; background: #0d1317;">
                                    <img src="${item.icon}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/400x200?text=Asset+Pending...'">
                                </div>
                                <div class="wiki-card-body" style="padding: 24px; flex-grow: 1;">
                                    <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 1.5rem;">${item.title}</h3>
                                    <p style="color: #a0b0c0; font-size: 1rem; line-height: 1.6;">${item.description}</p>
                                </div>
                                <div style="padding: 0 24px 24px 24px;">
                                    <span class="download-btn" style="display: block; text-align: center; width: 100%; box-sizing: border-box; background: transparent; border: 2px solid #f3ae32; color: #fff; padding: 12px; border-radius: 6px; font-weight: bold;">
                                        ${currentSource === 'bloglist.json' ? 'READ POST' : 'READ MORE'}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    } else {
        // --- MOD/MAP LIST VIEW (Vertical Stacking Layout) ---
        grid.style.display = "flex";
        grid.style.flexDirection = "column";
        grid.style.gap = "20px";

        grid.innerHTML = paginatedMods.map((mod) => {
            const originalIndex = allMods.indexOf(mod);
            const isRecent = isNew(mod.date);
            const tagLabels = mod.tags ? mod.tags.map(tag => `<span class="card-tag-label" style="background: rgba(243,174,50,0.1); color:#f3ae32; border:1px solid rgba(243,174,50,0.3); padding: 2px 8px; border-radius:4px; font-size:0.65rem; margin-right:5px; font-weight:bold;">${tag.toUpperCase()}</span>`).join('') : '';

            return `
                <div class="mod-card" onclick="showDetails(${originalIndex})" 
                     style="display: flex; align-items: center; width: 100%; min-height: 140px; background: #1a242d; border: 1px solid #3d4d5e; border-radius: 8px; overflow: hidden; cursor: pointer; position: relative;">
                    
                    ${isRecent ? `<span style="position: absolute; top: 10px; right: 10px; background: #f3ae32; color: #000; padding: 2px 8px; border-radius: 3px; font-size: 0.7rem; font-weight: bold; z-index: 5;">NEW</span>` : ''}
                    
                    <div style="width: 120px; min-width: 120px; height: 120px; margin: 10px; border: 2px solid #f3ae32; overflow: hidden; background: #0d1317;">
                        <img src="${mod.icon}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/120?text=Pending'">
                    </div>

                    <div style="flex-grow: 1; padding: 10px 20px;">
                        <h3 style="margin: 0; color: #f3ae32; font-size: 1.5rem;">${mod.title}</h3>
                        <div style="font-size: 0.8rem; color: #a0b0c0; margin-bottom: 8px;">BY ${mod.author.toUpperCase()}</div>
                        <div style="margin-bottom: 8px;">${tagLabels}</div>
                        <p style="margin: 0; color: #cbd5e0; font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${mod.description}</p>
                    </div>

                    <div style="padding: 20px; min-width: 160px; background: rgba(0,0,0,0.2); height: 100%; display: flex; align-items: center; justify-content: center;">
                        <span class="download-btn" style="border: 2px solid #f3ae32; color: #f3ae32; padding: 10px; width: 100%; text-align: center; border-radius: 4px; font-weight: bold;">VIEW DETAILS</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    renderControls();
};

/**
 * Generates the Detailed View
 */
const showDetails = (modIndex, skipPush = false) => {
    const mod = allMods[modIndex];
    const mainView = document.getElementById("main-view");
    const detailsView = document.getElementById("details-view");
    const isBlog = currentSource === 'bloglist.json';
    const isWiki = currentSource === 'wikihytale.json';

    if (!skipPush) {
        const slug = (mod.slug || mod.title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const url = new URL(window.location);
        url.searchParams.set("card", slug);
        window.history.pushState({ modIndex }, "", url);
    }

    if (mainView) mainView.style.display = "none";
    if (detailsView) detailsView.style.display = "block";

    const finalDownloadUrl = getDirectDownloadUrl(mod.downloadUrl || "#");

    detailsView.innerHTML = `
        <div class="details-container">
            <button class="back-btn" onclick="closeDetails()">← BACK TO LIST</button>

            <div class="details-header">
                ${(isBlog || isWiki) ? '' : `<img src="${mod.icon}" class="mod-icon" style="width:120px; height:120px;">`}

                <div class="details-header-text">
                    ${(isBlog || isWiki) && mod.category ? `<span class="blog-category-tag">${mod.category}</span>` : ''}
                    <h2>${mod.title} ${(!isBlog && !isWiki) ? `<span class="mod-version-tag">${mod.version}</span>` : ''}</h2>
                    <p class="mod-author">By ${mod.author} ${mod.date ? `on ${mod.date}` : ''}</p>

                    <div style="margin-top:14px; display:flex; gap:12px; flex-wrap:wrap;">
                        ${(!isBlog && !isWiki) ? `<a href="${finalDownloadUrl}" target="_blank" class="download-btn">DOWNLOAD FILE</a>` : ''}
                        <button onclick="shareCurrentCard()" class="download-btn" style="background:transparent; display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-link"></i>
                            SHARE
                        </button>
                    </div>
                </div>
            </div>

            <hr style="border:0; border-top:1px solid #3d4d5e; margin: 30px 0;">

            <div class="content-body">
                ${(isBlog || isWiki) ? `<img src="${mod.icon}" class="blog-hero-img" style="width:100%; border-radius:10px; margin-bottom:20px;">` : ''}
                <h3>${(isBlog || isWiki) ? 'ARTICLE CONTENT' : 'DESCRIPTION'}</h3>
                <div class="long-desc" style="color: #cbd5e0; line-height: 1.8; font-size: 1.1rem;">
                    ${(mod.longDescription || mod.description)}
                </div>
            </div>

            ${(!isBlog && !isWiki) && mod.gallery && mod.gallery.length > 0 ? `
                <h3>GALLERY</h3>
                <div class="gallery-grid">
                    ${mod.gallery.map(img => `<img src="${img}" class="gallery-img">`).join('')}
                </div>
            ` : ''}

            <div class="comment-wrapper">
                <hr style="border:0; border-top:1px solid #3d4d5e; margin: 50px 0 30px;">
                <h3 style="color: #f3ae32;">COMMENTS & DISCUSSIONS</h3>
                <div id="utterances-container"></div>
            </div>
        </div>
    `;

    loadUtterances(mod.title);
    window.scrollTo({ top: 400, behavior: 'smooth' });
};


/**
 * Helper: Google Drive Direct Links
 */
const getDirectDownloadUrl = (url) => {
    if (!url || !url.includes('drive.google.com')) return url;
    let fileId = "";
    if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
    } else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
    }
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : url;
};

/**
 * Search & Filters Logic
 */
const setupEventListeners = () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            applyFilters();
        });
    }
};

/**
 * Generates the Filter UI with Dynamic Tag Counters
 */
const generateFilterUI = () => {
    const filterContainer = document.getElementById('filter-section');
    if (!filterContainer) return;

    // 1. Calculate tag frequencies
    const tagCounts = {};
    allMods.forEach(mod => {
        if (mod.tags && Array.isArray(mod.tags)) {
            mod.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    // 2. Clear existing items but keep the header if you have one
    filterContainer.innerHTML = '<h4>Filter by Type</h4>';

    // 3. Sort tags alphabetically and create the UI elements
    const sortedTags = Object.keys(tagCounts).sort();

    sortedTags.forEach(tag => {
        const count = tagCounts[tag];
        const label = document.createElement('label');
        label.className = 'filter-item';
        
        // Inline styles to match your UI and handle the count bubble
        label.style.display = 'flex';
        label.style.justifyContent = 'space-between';
        label.style.alignItems = 'center';
        label.style.cursor = 'pointer';
        label.style.padding = '5px 0';

        label.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" value="${tag}" ${activeTags.has(tag) ? 'checked' : ''}>
                <span>${tag}</span>
            </div>
            <span class="tag-count" style="background: rgba(243,174,50,0.15); color: #f3ae32; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: bold; border: 1px solid rgba(243,174,50,0.3);">
                ${count}
            </span>
        `;

        label.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) activeTags.add(tag);
            else activeTags.delete(tag);
            applyFilters();
        });

        filterContainer.appendChild(label);
    });
};

const applyFilters = () => {
    filteredMods = allMods.filter(mod => {
        const matchesSearch = mod.title.toLowerCase().includes(searchQuery) || 
                              mod.author.toLowerCase().includes(searchQuery);
        const matchesTags = activeTags.size === 0 || 
                            (mod.tags && mod.tags.some(t => activeTags.has(t)));
        return matchesSearch && matchesTags;
    });
    renderPage(1);
};

window.switchCategory = (source, element) => {
    document.querySelectorAll('.nav-links a, .hero-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    activeTags.clear();
    searchQuery = "";
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = "";
    initHyteEngine(source);
};

const loadUtterances = (identifier) => {
    const container = document.getElementById('utterances-container');
    if (!container) return;
    container.innerHTML = '<p>Loading reviews...</p>';
    const script = document.createElement('script');
    script.src = "https://utteranc.es/client.js";
    script.setAttribute('repo', GITHUB_REPO);
    script.setAttribute('issue-term', identifier);
    script.setAttribute('theme', "dark-blue");
    script.setAttribute('crossorigin', "anonymous");
    script.async = true;
    script.onload = () => container.querySelector('p')?.remove();
    container.appendChild(script);
};

// --- Socials Floating Panel (Simplified) ---
const renderFloatingSocials = async () => {
    const containerId = "floating-socials";
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        container.style.position = "fixed";
        container.style.top = "60px";
        container.style.right = "20px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";
        container.style.zIndex = "999";
        document.body.appendChild(container);
    }

    try {
        const res = await fetch("socialslist.json");
        const socials = await res.json();

        container.innerHTML = ""; // clear existing

        for (const social of socials) {
            const btn = document.createElement("a");
            btn.href = social.url;
            btn.target = "_blank";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.gap = "6px";
            btn.style.padding = "8px 12px";
            btn.style.background = "#1a242d";
            btn.style.color = "#f3ae32";
            btn.style.borderRadius = "6px";
            btn.style.fontWeight = "bold";
            btn.style.textDecoration = "none";
            btn.style.fontSize = "0.95rem";
            btn.style.transition = "all 0.2s";
            btn.onmouseover = () => { btn.style.background = "#f3ae32"; btn.style.color = "#000"; };
            btn.onmouseout = () => { btn.style.background = "#1a242d"; btn.style.color = "#f3ae32"; };

            const icon = document.createElement("i");
            icon.className = social.icon;
            btn.appendChild(icon);

            const label = document.createElement("span");
            label.innerText = social.name;
            btn.appendChild(label);

            // Only Discord gets a live counter
            if (social.name.toLowerCase() === "discord" && social.counterApi) {
                const counterSpan = document.createElement("span");
                counterSpan.style.marginLeft = "6px";
                counterSpan.innerText = "...";

                fetch(social.counterApi)
                    .then(r => r.json())
                    .then(data => {
                        const keys = social.counterField.split(".");
                        let value = data;
                        for (const k of keys) value = value?.[k];
                        counterSpan.innerText = value ?? "-";
                    })
                    .catch(() => counterSpan.innerText = "-");

                btn.appendChild(counterSpan);
            }

            container.appendChild(btn);
        }
    } catch (err) {
        console.error("Failed to load socials.json:", err);
    }
};


// Run after engine initializes
document.addEventListener("DOMContentLoaded", renderFloatingSocials);



/**
 * HyteEngine SEO Module
 * Automatically pulls tags from JSON files and updates Site Metadata
 */
async function updateSiteSEO() {
    const dataSources = [
        'modlist.json',
        'hytalewiki.json',
        'bloglist.json',
        'maplist.json'
    ];

    // Using a Set to ensure we don't have duplicate keywords
    let keywordLibrary = new Set(["Hytale", "Modding", "HyteServe"]);

    try {
        // Fetch all files at once for speed
        const results = await Promise.allSettled(
            dataSources.map(url => fetch(url).then(res => res.json()))
        );

        results.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                result.value.forEach(item => {
                    // Check if the item has a "tags" array
                    if (item.tags && Array.isArray(item.tags)) {
                        item.tags.forEach(tag => {
                            if (tag.length > 2) { // Only add meaningful tags
                                keywordLibrary.add(tag.trim());
                            }
                        });
                    }
                });
            }
        });

        // Convert the library to a comma-separated string
        const finalKeywords = Array.from(keywordLibrary).join(', ');

        // Update the HTML Meta Tag
        const metaTag = document.getElementById('dynamic-seo-tags');
        if (metaTag) {
            metaTag.setAttribute('content', finalKeywords);
            // console.log("SEO Engine: Tags synchronized successfully.");
        }

    } catch (err) {
        console.error("SEO Engine Error:", err);
    }
}

// Initialize SEO update on load
document.addEventListener('DOMContentLoaded', updateSiteSEO);

const renderControls = () => {
    const nav = document.getElementById("pagination");
    if (!nav) return;
    const totalPages = Math.ceil(filteredMods.length / modsPerPage);
    nav.innerHTML = '';
    if (totalPages <= 1) return;
    const createBtn = (text, targetPage, active = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.className = `page-btn ${active ? 'active' : ''}`;
        btn.innerText = text;
        btn.disabled = disabled;
        btn.onclick = () => { renderPage(targetPage); window.scrollTo({ top: 400, behavior: 'smooth' }); };
        return btn;
    };
    nav.appendChild(createBtn('Prev', currentPage - 1, false, currentPage === 1));
    for (let i = 1; i <= totalPages; i++) nav.appendChild(createBtn(i, i, i === currentPage));
    nav.appendChild(createBtn('Last', totalPages, false, currentPage === totalPages));
};

/**
 * HyteEngine Social Preview Sync
 * Ensures the preview URL stays accurate to the current window
 */
function syncSocialPreview() {
    const currentUrl = window.location.href;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    
    if (ogUrl) {
        ogUrl.setAttribute('content', currentUrl);
    }
}

function closeDetails() {
    const mainView = document.getElementById("main-view");
    const detailsView = document.getElementById("details-view");

    if (mainView) mainView.style.display = "block";
    if (detailsView) detailsView.style.display = "none";

    const url = new URL(window.location);
    url.searchParams.delete("card");
    window.history.pushState({}, "", url);
}

function shareCurrentCard() {
    const url = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: "HyteServe",
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert("Share link copied!");
    }
}

window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("card");

    if (!slug) return;

    const index = allMods.findIndex(mod => {
        const s = (mod.slug || mod.title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        return s === slug;
    });

    if (index !== -1) {
        setTimeout(() => showDetails(index, true), 300);
    }
});

const tips = [
    "Did you know? You can view mod galleries in full-screen mode!",
    "Tip: Use tags to filter mods faster.",
    "Pro Tip: Share your favorite mods with friends via the SHARE button.",
    "Hint: New mods are marked with a golden NEW tag.",
    "Fun Fact: HyteServe supports custom maps too!",
];

let tipInterval;

const showLoadingScreen = (duration = 6000) => {
    const loader = document.getElementById("loading-screen");
    const tipBox = document.getElementById("loading-tip");
    if (!loader || !tipBox) return;

    loader.classList.remove("hidden");

    // Pick a random tip initially
    let tipIndex = Math.floor(Math.random() * tips.length);
    tipBox.innerText = tips[tipIndex];

    // Rotate tips every 1 second (optional if loading > 1s)
    tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % tips.length;
        tipBox.innerText = tips[tipIndex];
    }, 3000);

    // Hide after duration
    setTimeout(() => {
        loader.classList.add("hidden");
        clearInterval(tipInterval); // stop rotating tips
    }, duration);
};

// Show loading on page load
document.addEventListener("DOMContentLoaded", () => showLoadingScreen());


// Optional: Show loading screen before rendering a new page (SPA navigation)
const showPageWithLoader = (renderFn) => {
    showLoadingScreen();
    setTimeout(() => {
        renderFn();
    }, 1000); // match loading duration
};


// Run after the page loads
document.addEventListener('DOMContentLoaded', syncSocialPreview);

window.openDonation = () => window.open('https://paypal.me/2players1Gamer', '_blank');

document.addEventListener("DOMContentLoaded", () => initHyteEngine());
