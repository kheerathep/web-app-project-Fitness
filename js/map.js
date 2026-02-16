let map;
let markers = [];
let fitnessData = [];
let currentLang = 'th';

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
        "lbl_direction": "ดูรายละเอียด", "lbl_website": "เว็บไซต์"
    },
    "en": {
        "price": "Price", "updated": "Updated", "search": "Search gyms...", "results": "Results Found",
        "nav_home": "Home", "nav_map": "Map", "loading": "Loading data...",
        "error": "Error loading data",
        "filter_all": "All",
        "filter_24": "Open 24/7",
        "lbl_direction": "View Details", "lbl_website": "Website"
    },
    "cn": {
        "price": "价格", "updated": "更新日期", "search": "搜索健身房...", "results": "结果",
        "nav_home": "首页", "nav_map": "地图", "loading": "正在加载数据...",
        "error": "加载数据错误",
        "filter_all": "全部",
        "filter_24": "24小时营业",
        "lbl_direction": "查看详情", "lbl_website": "网站"
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
            if (list) list.innerHTML = `<div class="text-red-500 text-center p-4">Error loading data.</div>`;
        });
}

// if URL contains ?q=term, prepopulate search and show first gym
function applyQuery() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!q) return;
    const term = q.toLowerCase();
    const input = document.getElementById('search-input');
    if (input) input.value = q;

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
            map: map, title: name
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
        let imageHTML = item.image_url ? `<img src="${resolveImageUrl(item.image_url)}" class="h-full w-full object-cover">` : `<div class="flex items-center justify-center h-full bg-gray-200"><span class="material-symbols-outlined">fitness_center</span></div>`;

        const card = document.createElement('div');
        card.className = "flex gap-4 rounded-2xl bg-white p-3 cursor-pointer border border-border-light hover:border-primary mb-4 shadow-sm group hover:shadow-md transition";
        card.innerHTML = `
            <div class="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">${imageHTML}</div>
            <div class="flex flex-1 flex-col justify-between">
                <h3 class="font-bold group-hover:text-primary transition">${name}</h3>
                <div class="text-sm text-primary font-bold">${item.price[currentLang]}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            map.panTo({ lat: item.lat, lng: item.lng });
            map.setZoom(16);
            showGymDetail(item); 
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

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = dictionary[lang].search;

    const navHome = document.getElementById("nav-home");
    const navMap = document.getElementById("nav-map");
    const filterAll = document.getElementById("filter-all");
    const filter24 = document.getElementById("filter-24");

    if (filterAll) filterAll.innerText = dictionary[lang].filter_all;
    if (filter24) filter24.innerText = dictionary[lang].filter_24;
    if (navHome) navHome.innerText = dictionary[lang].nav_home;
    if (navMap) navMap.innerText = dictionary[lang].nav_map;

    const lblDir = document.getElementById('lbl-direction');
    const lblWeb = document.getElementById('lbl-website');
    if (lblDir) lblDir.innerText = dictionary[lang].lbl_direction;
    if (lblWeb) lblWeb.innerText = dictionary[lang].lbl_website;

    renderAll(fitnessData);
}

function showGymDetail(item) {
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
    const lblDir = document.getElementById('lbl-direction');
    const lblWeb = document.getElementById('lbl-website');
    
    if (lblDir) lblDir.innerText = dictionary[currentLang].lbl_direction;

    if (dirBtn && webBtn) {
        dirBtn.href = `gymdetail.html?id=${item.id}&lang=${currentLang}`;

        const iconWeb = webBtn.querySelector('.material-symbols-outlined');

        if (item.website) {
            webBtn.href = item.website;
            webBtn.classList.remove('hidden');
            webBtn.classList.add('flex');
            
            if (item.website.includes('facebook.com') || item.website.includes('fb.com')) {
                lblWeb.innerText = "Facebook";
                webBtn.className = "flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#1465d1] transition";
                if(iconWeb) iconWeb.innerText = "public"; 
            }
            else if (item.website.includes('instagram.com')) {
                lblWeb.innerText = "Instagram";
                webBtn.className = "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 text-sm font-bold hover:opacity-90 transition";
                if(iconWeb) iconWeb.innerText = "photo_camera"; 
            }
            else {
                lblWeb.innerText = dictionary[currentLang].lbl_website || "Website";
                webBtn.className = "flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-black hover:border-black transition";
                if(iconWeb) iconWeb.innerText = "public";
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
    if (panel) {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
    }
}

function filterGyms(type) {
    let filtered = type === 'all' ? fitnessData : fitnessData.filter(i => i.tags && i.tags.includes('24hr'));
    renderAll(filtered);

    const btnAll = document.getElementById('filter-all');
    const btn24 = document.getElementById('filter-24');

    const inactiveClass = "whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-black hover:border-primary transition shadow-sm cursor-pointer";
    const activeClass = "whitespace-nowrap rounded-full bg-primary text-white px-4 py-1.5 text-sm font-bold shadow-md shadow-red-500/20 cursor-default";

    if (type === 'all') {
        if (btnAll) btnAll.className = activeClass;
        if (btn24) btn24.className = inactiveClass;
    } else {
        if (btnAll) btnAll.className = inactiveClass;
        if (btn24) btn24.className = activeClass;
    }
}

function closeDetail() {
    const panel = document.getElementById('floating-panel');
    if (panel) {
        panel.classList.add('hidden');
        panel.classList.remove('flex');
    }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = fitnessData.filter(i =>
                (i.name.th && i.name.th.toLowerCase().includes(term)) ||
                (i.name.en && i.name.en.toLowerCase().includes(term)) ||
                (i.name.cn && i.name.cn.toLowerCase().includes(term))
            );
            renderAll(filtered);
        });
    }

    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-ml-[500px]');
            const icon = toggleBtn.querySelector('span');
            if (sidebar.classList.contains('-ml-[500px]')) {
                icon.innerText = 'chevron_right';
            } else {
                icon.innerText = 'chevron_left';
            }
        });
    }

    // เพิ่ม Event Listener ให้ปุ่ม Filter
    const btnAll = document.getElementById('filter-all');
    const btn24 = document.getElementById('filter-24');
    if (btnAll) btnAll.addEventListener('click', () => filterGyms('all'));
    if (btn24) btn24.addEventListener('click', () => filterGyms('24hr'));
});
