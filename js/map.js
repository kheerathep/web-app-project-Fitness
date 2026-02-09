// --- กำหนดตัวแปร Global ---
let map;
let markers = []; 
let fitnessData = []; 
let currentLang = 'en'; // เริ่มต้นเป็นภาษาอังกฤษตาม HTML

const dictionary = {
    "th": { "price": "ราคา", "updated": "อัปเดตเมื่อ", "search": "ค้นหาฟิตเนส...", "results": "ผลลัพธ์" },
    "en": { "price": "Price", "updated": "Updated", "search": "Search gyms...", "results": "Results Found" },
    "cn": { "price": "价格", "updated": "更新日期", "search": "搜索健身房...", "results": "结果" }
};

// --- 1. เริ่มต้นทำงานเมื่อเว็บโหลดเสร็จ (สำคัญมาก ส่วนนี้คือที่ขาดไป) ---
document.addEventListener("DOMContentLoaded", () => {
    // ผูกปุ่มเปลี่ยนภาษา
    document.getElementById('btn-th').addEventListener('click', () => changeLang('th'));
    document.getElementById('btn-en').addEventListener('click', () => changeLang('en'));
    document.getElementById('btn-cn').addEventListener('click', () => changeLang('cn'));

    // ผูกช่องค้นหา
    document.getElementById('search-input').addEventListener('keyup', handleSearch);
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const icon = toggleBtn.querySelector('span');
    let isOpen = true;

    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isOpen = !isOpen; // สลับสถานะ

            if (isOpen) {
                // เปิด Sidebar
                sidebar.classList.remove('-ml-[500px]'); // ดึงกลับมา
                icon.innerText = 'chevron_left'; // เปลี่ยนลูกศรชี้ซ้าย
            } else {
                // ปิด Sidebar (Map เต็มจอ)
                sidebar.classList.add('-ml-[500px]'); // ดันออกไปทางซ้ายจนสุด
                icon.innerText = 'chevron_right'; // เปลี่ยนลูกศรชี้ขวา
            }
            
            // สั่งให้ Google Map รับรู้ว่าขนาดจอเปลี่ยน (ป้องกันแผนที่เบี้ยว)
            setTimeout(() => {
                if(map) google.maps.event.trigger(map, "resize");
            }, 300);
        });
    }
});

// --- 2. ฟังก์ชัน Google Maps ---
function initMap() {
    const centerPoint = { lat: 13.8196, lng: 100.0389 };
    const mapStyle = [
        { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] }
    ];

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: centerPoint,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: mapStyle
    });

    loadData();
    
}

// --- 3. ดึงข้อมูล ---
function loadData() {
    fetch('data/data.json')
        .then(response => response.json())
        .then(json => {
            fitnessData = json;
            renderAll(); 
        })
        .catch(error => {
            console.error("Error:", error);
            // สร้างข้อมูลจำลองถ้าโหลดไฟล์ไม่ได้ (เผื่อทดสอบ)
            fitnessData = [];
            renderSidePanel();
        });
}

// --- 4. ฟังก์ชันวาดหน้าจอ ---
function renderAll() {
    renderMarkers(fitnessData); // วาดหมุดทั้งหมด
    renderSidePanel(fitnessData); // วาดลิสต์ทั้งหมด
}

function renderMarkers(data) {
    // ลบหมุดเก่า
    markers.forEach(m => m.setMap(null));
    markers = [];

    data.forEach(item => {
        const name = item.name[currentLang] || item.name['en'];
        const contentString = `
            <div style="font-family: 'Manrope', sans-serif; padding: 5px;">
                <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${name}</h3>
                <p style="color: #ef4444; font-weight: bold;">${item.price}</p>
            </div>
        `;
        const infoWindow = new google.maps.InfoWindow({ content: contentString });
        const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map: map,
            title: name,
        });
        marker.addListener("click", () => infoWindow.open(map, marker));
        markers.push(marker);
    });
}

function renderSidePanel(data) {
    const listContainer = document.getElementById('gym-list');
    listContainer.innerHTML = ''; 

    // หัวข้อจำนวนผลลัพธ์
    const countHeader = document.createElement('div');
    countHeader.className = "text-sm font-bold text-text-subtle uppercase tracking-wider mb-2";
    countHeader.innerText = `${data.length} ${dictionary[currentLang].results}`;
    listContainer.appendChild(countHeader);

    data.forEach((item) => {
        const name = item.name[currentLang] || item.name['en'];
        
        let imageHTML = '';
        if (item.image_url) {
            imageHTML = `<img src="${item.image_url}" class="h-full w-full object-cover" alt="${name}">`;
        } else {
            imageHTML = `<div class="flex items-center justify-center h-full text-gray-400 bg-gray-200"><span class="material-symbols-outlined text-4xl">fitness_center</span></div>`;
        }

        const card = document.createElement('div');
        card.className = "group flex flex-col sm:flex-row gap-4 rounded-2xl bg-white p-3 transition hover:shadow-lg hover:-translate-y-1 cursor-pointer border border-border-light hover:border-primary/20 mb-4";
        
        card.innerHTML = `
            <div class="relative h-40 sm:h-32 w-full sm:w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                ${imageHTML}
            </div>
            <div class="flex flex-1 flex-col justify-between py-1">
                <div>
                    <h3 class="font-bold text-lg text-black leading-tight group-hover:text-primary transition-colors">${name}</h3>
                    <div class="mt-1 flex items-center gap-1 text-xs text-text-subtle">
                        <span class="material-symbols-outlined text-[14px] text-primary">location_on</span>
                        ${item.district || 'Nakhon Pathom'}
                    </div>
                </div>
                <div class="mt-3 flex items-end justify-between">
                    <div class="text-xs text-text-subtle">${dictionary[currentLang].updated}: ${item.updated_date}</div>
                    <div class="text-lg font-bold text-primary">${item.price}</div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            map.panTo({ lat: item.lat, lng: item.lng });
            map.setZoom(15);
        });

        listContainer.appendChild(card);
    });
}

// --- 5. ฟังก์ชันเปลี่ยนภาษา ---
function changeLang(lang) {
    currentLang = lang;

    // Reset สไตล์ปุ่มกด (กำหนด class ใหม่โดยตรงเพื่อให้ชัวร์ที่สุด)
    const inactiveClass = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-gray-200 transition text-[11px] font-bold text-text-subtle cursor-pointer";
    const activeClass = "lang-btn flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-black shadow-sm cursor-default";

    // รีเซ็ตทุกปุ่มเป็น inactive
    document.querySelectorAll('.lang-btn').forEach(btn => btn.className = inactiveClass);

    // ตั้งค่าปุ่มที่ถูกกดเป็น active
    const activeBtn = document.getElementById('btn-' + lang);
    if(activeBtn) activeBtn.className = activeClass;

    // เปลี่ยน Placeholder
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.placeholder = dictionary[lang].search;

    renderAll(); // วาดข้อมูลใหม่เป็นภาษาที่เลือก
}

// --- 6. ฟังก์ชันค้นหา ---
function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filteredData = fitnessData.filter(item => {
        const nameMatch = (item.name.th && item.name.th.includes(term)) || 
                          (item.name.en && item.name.en.toLowerCase().includes(term));
        return nameMatch;
    });
    renderSidePanel(filteredData);
}