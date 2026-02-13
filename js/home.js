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
        "btn_explore": "สำรวจแผนที่"
    },
    "en": {
        "price": "Price",  "search": "Search gyms...", "search_hero": "Search by name or area...",
        "nav_home": "Home", "nav_map": "Map",
        "hero_sub": "Find your perfect gym in Nakhon Pathom",
        "btn_explore": "Explore Map"
    },
    "cn": {
        "price": "价格",  "search": "搜索健身房...", "search_hero": "按名称或地区搜索...",
        "nav_home": "首页", "nav_map": "地图",
        "hero_sub": "在那空拍他姆找到理想的健身房",
        "btn_explore": "探索地图"
    }
};

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
}

// set initial language once DOM ready
function setupExploreButton() {
    const btn = document.getElementById('btn-explore');
    const heroSearch = document.getElementById('hero-search');
    if (btn && heroSearch) {
        btn.addEventListener('click', () => {
            const query = heroSearch.value.trim();
            const url = new URL(window.location.href);
            url.pathname = 'map.html';
            if (query) url.searchParams.set('q', query);
            window.location.href = url.toString();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    changeLang(currentLang);
    setupExploreButton();
});