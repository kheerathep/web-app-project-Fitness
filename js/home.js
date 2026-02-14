let currentLang = 'th';
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#dc2626",
                "primary-hover": "#b91c1c",
                "background-light": "#ffffff",
                "background-off": "#f3f4f6",
                "text-main": "#000000",
                "text-subtle": "#6b7280"
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
            borderRadius: {"DEFAULT": "0.75rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
        },
    },
}
const dictionary = {
    "th": {
        "price": "ราคา",  "search": "ค้นหาฟิตเนส...", "search_hero": "ค้นหาตามชื่อหรือพื้นที่...",
        "nav_home": "หน้าหลัก", "nav_map": "แผนที่", 
        "hero_sub": "ค้นหาฟิตเนสที่ใช่ในนครปฐม",
        "btn_explore": "สำรวจแผนที่",
        "trending_now": "กำลังเป็นกระแส",
        "trending_now_desc": "สถานที่ยอดนิยมในนครปฐมสัปดาห์นี้",
        "footer_desc": "คู่มือฟิตเนสที่ดีที่สุดสำหรับชาวนครปฐม เปรียบเทียบราคา ค้นหาข้อเสนอ และบรรลุเป้าหมายของคุณ",
        "platform": "แพลตฟอร์ม",
        "search_gyms": "ค้นหาโรงยิม",
        "interactive_map": "แผนที่แบบโต้ตอบ",
        "company": "บริษัท",
        "about_us": "เกี่ยวกับเรา",
        "contact_support": "ติดต่อฝ่ายสนับสนุน",
        "privacy_policy": "นโยบายความเป็นส่วนตัว",
        "social": "โซเชียล"
    },
    "en": {
        "price": "Price",  "search": "Search gyms...", "search_hero": "Search by name or area...",
        "nav_home": "Home", "nav_map": "Map",
        "hero_sub": "Find your perfect gym in Nakhon Pathom",
        "btn_explore": "Explore Map",
        "trending_now": "TRENDING NOW",
        "trending_now_desc": "Most popular spots in Nakhon Pathom this week",
        "footer_desc": "The ultimate fitness companion for Nakhon Pathom residents. Compare prices, find deals, and reach your goals.",
        "platform": "PLATFORM",
        "search_gyms": "Search Gyms",
        "interactive_map": "Interactive Map",
        "company": "COMPANY",
        "about_us": "About Us",
        "contact_support": "Contact Support",
        "privacy_policy": "Privacy Policy",
        "social": "SOCIAL"
    },
    "cn": {
        "price": "价格",  "search": "搜索健身房...", "search_hero": "按名称或地区搜索...",
        "nav_home": "首页", "nav_map": "地图",
        "hero_sub": "在那空拍他姆找到理想的健身房",
        "btn_explore": "探索地图",
        "trending_now": "现在流行",
        "trending_now_desc": "本周那空巴吞最受欢迎的景点",
        "footer_desc": "那空巴吞居民的终极健身伴侣。比较价格、寻找优惠并实现您的目标。",
        "platform": "平台",
        "search_gyms": "搜索健身房",
        "interactive_map": "互动地图",
        "company": "公司",
        "about_us": "关于我们",
        "contact_support": "联系支持",
        "privacy_policy": "隐私政策",
        "social": "社交"
    }
};
let homepageData = [];

function buildUrl(path) {
    return new URL(path, window.location.href).toString();
}

function resolveImageUrl(path) {
    if (!path) return "https://via.placeholder.com/800x500?text=No+Image";
    if (/^https?:\/\//i.test(path)) return path;
    return buildUrl(path.replace(/\\/g, "/"));
}

function getStartingFromLabel() {
    if (currentLang === "th") return "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E17\u0E35\u0E48";
    if (currentLang === "cn") return "\u8D77\u4EF7";
    return "Starting from";
}

function applyTranslations(lang) {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (dictionary[lang] && dictionary[lang][key]) {
            element.innerText = dictionary[lang][key];
        }
    });
}

function changeLang(lang) {
    currentLang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.className = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-gray-200 transition text-[11px] font-bold text-text-subtle";
    });
    const activeBtn = document.getElementById('btn-' + lang);
    if (activeBtn) activeBtn.className = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-black shadow-sm";

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = dictionary[lang].search;

    const heroSearch = document.getElementById('hero-search');
    if (heroSearch) heroSearch.placeholder = dictionary[lang].search_hero;

    const exploreBtn = document.getElementById('btn-explore');
    if (exploreBtn && dictionary[lang].btn_explore) exploreBtn.innerText = dictionary[lang].btn_explore;

    const navHome = document.getElementById("nav-home");
    const navMap = document.getElementById("nav-map");

    if (navHome) navHome.innerText = dictionary[lang].nav_home;
    if (navMap) navMap.innerText = dictionary[lang].nav_map;

    const heroSub = document.getElementById('hero-sub');
    if (heroSub) heroSub.innerText = dictionary[lang].hero_sub;

    applyTranslations(lang);

    if (homepageData.length > 0) {
        renderTrendingSection(homepageData);
    }
}

// set initial language once DOM ready
function setupExploreButton() {
    const btn = document.getElementById('btn-explore');
    const heroSearch = document.getElementById('hero-search');
    if (btn && heroSearch) {
        btn.addEventListener('click', () => {
            const query = heroSearch.value.trim();
            const url = new URL(buildUrl("map.html"));
            if (query) url.searchParams.set('q', query);
            window.location.href = url.toString();
        });
    }
}

function getLangValue(value, lang) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || value.th || "";
}

function getLocationText(item) {
    const location = item.location || item.district || item.area || "Nakhon Pathom";
    if (location === "Muang, Nakhon Pathom") {
        if (currentLang === "th") return "\u0E40\u0E21\u0E37\u0E2D\u0E07, \u0E19\u0E04\u0E23\u0E1B\u0E10\u0E21";
        if (currentLang === "cn") return "\u4F5B\u7EDF\u5E9C\u5E02\u533A";
    }
    return location;
}

function getPriceText(item) {
    const price = getLangValue(item.price, currentLang);
    if (price) return price;
    return "-";
}

function renderTrendingSection(data) {
    const grid = document.getElementById("trending-grid");
    if (!grid) return;

    const badges = ["Most Popular", "Premium", "Open 24/7"];
    const items = data.slice(0, 3);

    grid.innerHTML = items.map((item, index) => {
        const name = getLangValue(item.name, currentLang) || "Gym";
        const location = getLocationText(item);
        const price = getPriceText(item);
        const image = resolveImageUrl(item.image_url);
        const rating = item.rating || item.score || "4.8";
        const mapUrl = new URL(buildUrl("map.html"));
        mapUrl.searchParams.set("q", getLangValue(item.name, "en") || name);

        return `
            <div class="group rounded-3xl bg-white border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                <div class="relative h-64 overflow-hidden">
                    <span class="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded uppercase tracking-wider z-10">${badges[index] || "Trending"}</span>
                    <img alt="${name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${image}" />
                </div>
                <div class="p-6 flex flex-col flex-1">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="text-xl font-black text-black">${name}</h4>
                        <div class="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                            <span class="material-symbols-outlined text-yellow-500 text-base fill-1">star</span>
                            <span class="text-sm font-bold text-black">${rating}</span>
                        </div>
                    </div>
                    <p class="text-text-subtle text-sm font-medium mb-6">${location}</p>
                    <div class="mt-auto flex items-end justify-between">
                        <div>
                            <p class="text-xs text-text-subtle font-medium mb-1">${getStartingFromLabel()}</p>
                            <p class="text-primary font-black text-xl">${price}</p>
                        </div>
                        <a href="${mapUrl.toString()}" class="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition">
                            View
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function loadHomepageData() {
    const sources = ["data/datahomepage.json", "data/data.json"];
    const trySource = (index) => {
        if (index >= sources.length) {
            throw new Error("Failed to load homepage data from all sources");
        }
        const source = sources[index];
        return fetch(buildUrl(source))
            .then((response) => {
                if (!response.ok) throw new Error(`Failed to load ${source}`);
                return response.json();
            })
            .then((data) => {
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error(`Empty data in ${source}`);
                }
                homepageData = data;
                renderTrendingSection(homepageData);
            })
            .catch(() => trySource(index + 1));
    };

    return trySource(0).catch((error) => {
        console.error("Homepage data load error:", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    changeLang(currentLang);
    setupExploreButton();
    loadHomepageData();
});
