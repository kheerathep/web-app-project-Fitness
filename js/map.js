
let map;
let markers = [];
let fitnessData = [];
let currentLang = 'th';
let currentDetailItem = null;

function buildUrl(path) {
    return new URL(path, window.location.href).toString();
}

function resolveImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/600x400?text=No+Image';
    if (/^https?:\/\//i.test(path)) return path;
    return buildUrl(path.replace(/\\/g, '/'));
}

const dictionary = {
    "th": {
        "price": "ราคา", "updated": "อัปเดตเมื่อ", "search": "ค้นหาฟิตเนส...", "results": "ผลลัพธ์",
        "nav_home": "หน้าหลัก", "nav_map": "แผนที่", "loading": "กำลังโหลดข้อมูล...",
        "error": "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        "filter_all": "ทั้งหมด",
        "filter_24": "เปิด 24 ชม.",
        "lbl_direction": "ดูรายละเอียด", "lbl_website": "เว็บไซต์",
        "view_list": "ดูรายการ", "view_map": "ดูแผนที่"
    },
    "en": {
        "price": "Price", "updated": "Updated", "search": "Search gyms...", "results": "Results Found",
        "nav_home": "Home", "nav_map": "Map", "loading": "Loading data...",
        "error": "Error loading data",
        "filter_all": "All",
        "filter_24": "Open 24/7",
        "lbl_direction": "View Details", "lbl_website": "Website",
        "view_list": "View List", "view_map": "View Map"
    },
    "cn": {
        "price": "价格", "updated": "更新日期", "search": "搜索健身房...", "results": "结果",
        "nav_home": "首页", "nav_map": "地图", "loading": "正在加载数据...",
        "error": "加载数据错误",
        "filter_all": "全部",
        "filter_24": "24小时营业",
        "lbl_direction": "查看详情", "lbl_website": "网站",
        "view_list": "查看列表", "view_map": "查看地图"
    }
};

function initMap() {
    const centerPoint = { lat: 13.8196, lng: 100.0389 };
    const mapStyle = [{ "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] }];

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12, center: centerPoint, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, styles: mapStyle
    });

    loadData();
}

function loadData() {
    fetch(buildUrl('data/data.json'))
        .then(response => {
            if (!response.ok) throw new Error('Failed to load data/data.json');
            return response.json();
        })
        .then(json => {
            fitnessData = json;
            changeLang(currentLang);
            applyQuery();
        })
        .catch(error => {
            console.error("Error:", error);
            const list = document.getElementById('gym-list');
            if (list) list.innerHTML = `<div class=\"text-red-500 text-center p-4\">Error loading data.</div>`;
        });
}

function applyQuery() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!q) return;
    const term = q.toLowerCase();
    
    document.getElementById('search-input').value = q;
    document.getElementById('search-input-mobile').value = q;


    const filtered = fitnessData.filter(i =>
        (i.name.th && i.name.th.toLowerCase().includes(term)) ||
        (i.name.en && i.name.en.toLowerCase().includes(term)) ||
        (i.name.cn && i.name.cn.toLowerCase().includes(term))
    );
    renderAll(filtered);

    if (filtered.length > 0) {
        const item = filtered[0];
        map.panTo({ lat: item.lat, lng: item.lng });
        map.setZoom(16);
        showGymDetail(item);
    }
}

function renderAll(dataToRender) {
    const data = dataToRender || fitnessData;
    renderMarkers(data);
    renderSidePanel(data);
}

function renderMarkers(data) {
    markers.forEach(m => m.setMap(null));
    markers = [];
    data.forEach(item => {
        const name = item.name[currentLang] || item.name['en'];

        const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map: map,
            title: name
        });

        marker.addListener("click", () => {
            map.panTo({ lat: item.lat, lng: item.lng });
            map.setZoom(16);
            showGymDetail(item);
        });

        markers.push(marker);
    });
}

function renderSidePanel(data) {
    const listContainer = document.getElementById('gym-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const countHeader = document.createElement('div');
    countHeader.className = "text-sm font-bold text-text-subtle uppercase tracking-wider mb-2";
    countHeader.innerText = `${data.length} ${dictionary[currentLang].results}`;
    listContainer.appendChild(countHeader);

    data.forEach((item, index) => {
        const name = item.name[currentLang] || item.name['en'];
        let imageHTML = item.image_url ? `<img src=\"${resolveImageUrl(item.image_url)}\" class=\"h-full w-full object-cover\">` : `<div class=\"flex items-center justify-center h-full bg-gray-200\"><span class=\"material-symbols-outlined\">fitness_center</span></div>`;

        const card = document.createElement('div');
        card.className = "flex gap-4 rounded-2xl bg-white p-3 cursor-pointer border border-border-light hover:border-primary mb-4 shadow-sm group hover:shadow-md transition";
        card.innerHTML = `
            <div class=\"h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100\">${imageHTML}</div>
            <div class=\"flex flex-1 flex-col justify-between\">
                <h3 class=\"font-bold group-hover:text-primary transition\">${name}</h3>
                <div class=\"text-sm text-primary font-bold\">${item.price[currentLang]}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            map.panTo({ lat: item.lat, lng: item.lng });
            map.setZoom(16);
            showGymDetail(item);
             // On mobile, switch to map view after clicking a gym
            if (window.innerWidth < 1024) {
                document.getElementById('show-map-btn').click();
            }
        });
        listContainer.appendChild(card);
    });
}

function changeLang(lang) {
    currentLang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.className = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-gray-200 transition text-[11px] font-bold text-text-subtle";
    });
    const activeBtn = document.getElementById('btn-' + lang);
    if (activeBtn) activeBtn.className = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-black shadow-sm";

    document.getElementById('search-input').placeholder = dictionary[lang].search;
    document.getElementById('search-input-mobile').placeholder = dictionary[lang].search;


    document.getElementById("nav-home").innerText = dictionary[lang].nav_home;
    document.getElementById("nav-home-mobile").innerText = dictionary[lang].nav_home;
    document.getElementById("nav-map").innerText = dictionary[lang].nav_map;
    document.getElementById("filter-all").innerText = dictionary[lang].filter_all;
    document.getElementById("filter-24").innerText = dictionary[lang].filter_24;
    document.getElementById('lbl-direction').innerText = dictionary[lang].lbl_direction;
    document.getElementById('lbl-website').innerText = dictionary[lang].lbl_website;
    
    const showListBtn = document.getElementById('show-list-btn');
    const showMapBtn = document.getElementById('show-map-btn');
    if (showListBtn) showListBtn.querySelector('span:last-child').innerText = dictionary[lang].view_list;
    if (showMapBtn) showMapBtn.querySelector('span:last-child').innerText = dictionary[lang].view_map;

    renderAll(fitnessData);

    if (currentDetailItem) {
        showGymDetail(currentDetailItem);
    }
}

function showGymDetail(item) {
    currentDetailItem = item;
    const name = item.name[currentLang] || item.name['en'];
    const price = item.price[currentLang] || item.price['en'];

    document.getElementById('detail-name').innerText = name;
    document.getElementById('detail-price').innerText = price;
    document.getElementById('detail-img').src = resolveImageUrl(item.image_url);

    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = '';
    if (item.tags) {
        item.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = "bg-gray-100 px-2 py-1 rounded-md";
            span.innerText = tag;
            tagsContainer.appendChild(span);
        });
    }

    const phoneContainer = document.getElementById('phone-container'); 
    const phoneLink = document.getElementById('detail-phone');
    
    if (phoneContainer && phoneLink) {
        if (item.contact) {
            phoneContainer.classList.remove('hidden');
            phoneContainer.classList.add('flex');
            phoneLink.innerText = item.contact;
            phoneLink.href = `tel:${item.contact}`; 
        } else {
            phoneContainer.classList.add('hidden');
            phoneContainer.classList.remove('flex');
        }
    }

    const dirBtn = document.getElementById('btn-direction');
    const webBtn = document.getElementById('btn-website');
    
    document.getElementById('lbl-direction').innerText = dictionary[currentLang].lbl_direction;

    if (dirBtn && webBtn) {
        dirBtn.href = `gymdetail.html?id=${item.id}&lang=${currentLang}`;

        const iconWeb = webBtn.querySelector('.material-symbols-outlined');
        const lblWeb = document.getElementById('lbl-website');

        if (item.website) {
            webBtn.href = item.website;
            webBtn.classList.remove('hidden');
            webBtn.classList.add('flex');
            
            if (item.website.includes('facebook.com') || item.website.includes('fb.com')) {
                lblWeb.innerText = "Facebook";
            } else if (item.website.includes('instagram.com')) {
                lblWeb.innerText = "Instagram";
            } else {
                lblWeb.innerText = dictionary[currentLang].lbl_website || "Website";
            }
        } else {
             webBtn.classList.add('hidden');
             webBtn.classList.remove('flex');
        }
    }

    const updatedDiv = document.getElementById('detail-updated');
    if (updatedDiv) {
        if (item.updated_date) { 
            const label = dictionary[currentLang].updated || "Updated";
            updatedDiv.innerText = `${label}: ${item.updated_date}`;
            updatedDiv.classList.remove('hidden');
        } else {
            updatedDiv.classList.add('hidden');
        }
    }

    const panel = document.getElementById('floating-panel');
    panel.classList.remove('hidden');
    panel.classList.add('flex');
}

function filterGyms(type) {
    let filtered = type === 'all' ? fitnessData : fitnessData.filter(i => i.tags && i.tags.includes('24hr'));
    renderAll(filtered);

    const btnAll = document.getElementById('filter-all');
    const btn24 = document.getElementById('filter-24');

    const inactiveClass = "whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-black hover:border-primary transition shadow-sm cursor-pointer";
    const activeClass = "whitespace-nowrap rounded-full bg-primary text-white px-4 py-1.5 text-sm font-bold shadow-md shadow-red-500/20 cursor-default";

    if (type === 'all') {
        btnAll.className = activeClass;
        btn24.className = inactiveClass;
    } else {
        btnAll.className = inactiveClass;
        btn24.className = activeClass;
    }
}

function closeDetail() {
    currentDetailItem = null;
    document.getElementById('floating-panel').classList.add('hidden');
    document.getElementById('floating-panel').classList.remove('flex');
}

function handleSearch(term) {
    const lowerCaseTerm = term.toLowerCase();
    const filtered = fitnessData.filter(i =>
        (i.name.th && i.name.th.toLowerCase().includes(lowerCaseTerm)) ||
        (i.name.en && i.name.en.toLowerCase().includes(lowerCaseTerm)) ||
        (i.name.cn && i.name.cn.toLowerCase().includes(lowerCaseTerm))
    );
    renderAll(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('search-input');
    const searchInputMobile = document.getElementById('search-input-mobile');

    searchInput.addEventListener('keyup', (e) => {
        const term = e.target.value;
        searchInputMobile.value = term;
        handleSearch(term);
    });

    searchInputMobile.addEventListener('keyup', (e) => {
        const term = e.target.value;
        searchInput.value = term;
        handleSearch(term);
    });
    

    document.getElementById('filter-all').addEventListener('click', () => filterGyms('all'));
    document.getElementById('filter-24').addEventListener('click', () => filterGyms('24hr'));
    
    // --- Mobile View Toggle Logic ---
    const showListBtn = document.getElementById('show-list-btn');
    const showMapBtn = document.getElementById('show-map-btn');
    const sidebar = document.getElementById('sidebar');
    const mainMap = document.getElementById('main-map');

    if (showListBtn && showMapBtn && sidebar && mainMap) {
        showListBtn.addEventListener('click', () => {
            mainMap.classList.add('hidden');
            sidebar.classList.remove('hidden');
            sidebar.classList.add('flex');

            showListBtn.classList.add('hidden');
            showMapBtn.classList.remove('hidden');
            showMapBtn.classList.add('flex');
        });

        showMapBtn.addEventListener('click', () => {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('flex');
            mainMap.classList.remove('hidden');
            
            showMapBtn.classList.add('hidden');
            showMapBtn.classList.remove('flex');
            showListBtn.classList.remove('hidden');
        });
    }

    const toggleSidebarBtn = document.getElementById('toggle-sidebar');

    if (toggleSidebarBtn && sidebar) {
        const icon = toggleSidebarBtn.querySelector('span');

        toggleSidebarBtn.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                // Mobile view: show the list
                if(showListBtn) showListBtn.click();
            } else {
                // Desktop view: toggle sidebar visibility
                if (sidebar.classList.contains('lg:flex')) {
                    sidebar.classList.remove('lg:flex');
                    icon.textContent = 'chevron_right';
                } else {
                    sidebar.classList.add('lg:flex');
                    icon.textContent = 'chevron_left';
                }
            }
        });
    }
});
