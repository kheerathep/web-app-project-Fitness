let map;
let markers = []; 
let fitnessData = []; 
let currentLang = 'th'; // เริ่มต้นภาษาไทย

const dictionary = {
    "th": { 
        "price": "ราคา", "updated": "อัปเดตเมื่อ", "search": "ค้นหาฟิตเนส...", "results": "ผลลัพธ์",
        "nav_home": "หน้าหลัก", "nav_map": "แผนที่" 
    },
    "en": { 
        "price": "Price", "updated": "Updated", "search": "Search gyms...", "results": "Results Found",
        "nav_home": "Home", "nav_map": "Map"
    },
    "cn": { 
        "price": "价格", "updated": "更新日期", "search": "搜索健身房...", "results": "结果",
        "nav_home": "首页", "nav_map": "地图" 
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
    fetch('data/data.json')
        .then(response => response.json())
        .then(json => {
            fitnessData = json;
            // หลังจากโหลดข้อมูลเสร็จ ให้ตั้งค่าภาษาเริ่มต้นทันที เพื่อให้หน้าเว็บตรงกับ currentLang
            changeLang(currentLang);
        })
        .catch(error => {
            console.error("Error:", error);
            const list = document.getElementById('gym-list');
            if(list) list.innerHTML = `<div class="text-red-500 text-center p-4">Error loading data.</div>`;
        });
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
        const contentString = `<div style="padding:5px"><b>${name}</b><br>${item.price}</div>`;
        const infoWindow = new google.maps.InfoWindow({ content: contentString });
        const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map: map, title: name
        });
        marker.addListener("click", () => infoWindow.open(map, marker));
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
        let imageHTML = item.image_url ? `<img src="${item.image_url}" class="h-full w-full object-cover">` : `<div class="flex items-center justify-center h-full bg-gray-200"><span class="material-symbols-outlined">fitness_center</span></div>`;
        
        const card = document.createElement('div');
        card.className = "flex gap-4 rounded-2xl bg-white p-3 cursor-pointer border border-border-light hover:border-primary mb-4 shadow-sm group hover:shadow-md transition";
        card.innerHTML = `
            <div class="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">${imageHTML}</div>
            <div class="flex flex-1 flex-col justify-between">
                <h3 class="font-bold group-hover:text-primary transition">${name}</h3>
                <div class="text-sm text-primary font-bold">${item.price}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            map.panTo({ lat: item.lat, lng: item.lng });
            map.setZoom(15);
            if(markers[index]) google.maps.event.trigger(markers[index], 'click');
        });
        listContainer.appendChild(card);
    });
}

// ฟังก์ชันเปลี่ยนภาษา (รวม Logic แก้ไขให้ครบแล้ว)
function changeLang(lang) {
    currentLang = lang;
    
    // 1. เปลี่ยนสีปุ่ม
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.className = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-gray-200 transition text-[11px] font-bold text-text-subtle";
    });
    const activeBtn = document.getElementById('btn-' + lang);
    if(activeBtn) activeBtn.className = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-black shadow-sm";

    // 2. เปลี่ยนข้อความในเว็บ (รวม Home/Map)
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.placeholder = dictionary[lang].search;

    const navHome = document.getElementById("nav-home");
    const navMap = document.getElementById("nav-map");
    if(navHome) navHome.innerText = dictionary[lang].nav_home;
    if(navMap) navMap.innerText = dictionary[lang].nav_map;

    // 3. วาดการ์ดและหมุดใหม่
    renderAll(fitnessData);
}

// Search & Filter Listeners
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('search-input');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = fitnessData.filter(i => i.name.th.includes(term) || i.name.en.toLowerCase().includes(term));
            renderAll(filtered);
        });
    }

    const toggleBtn = document.getElementById('toggle-sidebar');
    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-ml-[500px]');
            const icon = toggleBtn.querySelector('span');
            
            // เช็คว่า sidebar ถูกซ่อนหรือไม่
            if (sidebar.classList.contains('-ml-[500px]')) {
                icon.innerText = 'chevron_right';
            } else {
                icon.innerText = 'chevron_left';
            }
        });
    }
});

function filterGyms(type){
    let filtered = type === 'all' ? fitnessData : fitnessData.filter(i => i.tags && i.tags.includes('24hr'));
    renderAll(filtered);
    
    document.getElementById('filter-all').className = "whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-black hover:border-primary transition shadow-sm";
    document.getElementById('filter-24').className = "whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-black hover:border-primary transition shadow-sm";
    
    const activeId = type === 'all' ? 'filter-all' : 'filter-24';
    document.getElementById(activeId).className = "whitespace-nowrap rounded-full bg-primary text-white px-4 py-1.5 text-sm font-bold shadow-md shadow-red-500/20";
}