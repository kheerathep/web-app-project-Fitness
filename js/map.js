tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#dc2626", // Vibrant red
                "primary-hover": "#b91c1c",
                "background-light": "#ffffff",
                "background-off": "#f3f4f6", // Light gray
                "background-card": "#ffffff",
                "border-light": "#e5e7eb",
                "text-main": "#000000",
                "text-subtle": "#6b7280"
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
            borderRadius: {"DEFAULT": "1rem", "lg": "1.5rem", "xl": "2rem", "full": "9999px"},
        },
    },
}
let map;
let markers = []; 
let fitnessData = []; 
let currentLang = 'th';

const dictionary = {
    "th": { "price": "ราคา", "updated": "อัปเดตเมื่อ", "search": "ค้นหาฟิตเนส...", "results": "ผลลัพธ์" },
    "en": { "price": "Price", "updated": "Updated", "search": "Search gyms...", "results": "Results Found" },
    "cn": { "price": "价格", "updated": "更新日期", "search": "搜索健身房...", "results": "结果" }
};

// 1. เริ่มต้นแผนที่
function initMap() {
    // พิกัดกลางนครปฐม
    const centerPoint = { lat: 13.8196, lng: 100.0389 };
    
    // ปรับ style แผนที่ให้ดูคลีนๆ เข้ากับธีมเว็บ
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

    loadData(); // เรียกดึงข้อมูลทันที
}

// 2. ดึงข้อมูล JSON
function loadData() {
    fetch('data/data.json')
        .then(response => response.json())
        .then(json => {
            fitnessData = json;
            renderAll(); // วาดทุกอย่าง
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById('gym-list').innerHTML = `<div class="text-red-500 text-center p-4">Error loading data. Open with Live Server!</div>`;
        });
}

// 3. ฟังก์ชันรวม (วาดหมุด + วาดลิสต์ด้านซ้าย)
function renderAll() {
    renderMarkers();
    renderSidePanel();
}

// 4. วาดหมุดบนแผนที่
function renderMarkers() {
    // ลบหมุดเก่า
    markers.forEach(m => m.setMap(null));
    markers = [];

    fitnessData.forEach(item => {
        const name = item.name[currentLang] || item.name['en'];
        
        // สร้าง InfoWindow แบบเรียบง่าย
        const contentString = `
            <div style="font-family: 'Manrope', sans-serif; padding: 5px;">
                <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${name}</h3>
                <p style="color: #ef4444; font-weight: bold;">${item.price}</p>
                <p style="font-size: 12px; color: #666;">${dictionary[currentLang].updated}: ${item.updated_date}</p>
            </div>
        `;

        const infoWindow = new google.maps.InfoWindow({ content: contentString });

        const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map: map,
            title: name,
            // ใช้ไอคอนสีแดงมาตรฐาน หรือจะเปลี่ยนรูปก็ได้
        });

        marker.addListener("click", () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
}

// 5. วาดรายการด้านซ้าย (Side Panel) ให้เหมือนดีไซน์ใหม่
function renderSidePanel() {
    const listContainer = document.getElementById('gym-list');
    listContainer.innerHTML = ''; 

    // หัวข้อจำนวนผลลัพธ์
    const countHeader = document.createElement('div');
    countHeader.className = "text-sm font-bold text-text-subtle uppercase tracking-wider mb-2";
    countHeader.innerText = `${fitnessData.length} ${dictionary[currentLang].results}`;
    listContainer.appendChild(countHeader);

    fitnessData.forEach((item, index) => {
        const name = item.name[currentLang] || item.name['en'];
        
        // ⭐ ส่วนจัดการรูปภาพ (Image Logic) ⭐
        let imageHTML = '';
        if (item.image_url && item.image_url !== "") {
            // กรณีมีรูป: ให้ใส่ tag <img>
            // object-cover คือคำสั่งให้รูปเต็มกรอบโดยไม่เบี้ยว
            imageHTML = `<img src="${item.image_url}" class="h-full w-full object-cover transition duration-300 group-hover:scale-110" alt="${name}">`;
        } else {
            // กรณีไม่มีรูป: ให้แสดงไอคอนสีเทาๆ เหมือนเดิม
            imageHTML = `
                <div class="flex items-center justify-center h-full text-gray-400 bg-gray-200">
                    <span class="material-symbols-outlined text-4xl">fitness_center</span>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = "group flex flex-col sm:flex-row gap-4 rounded-2xl bg-white p-3 transition hover:shadow-lg hover:-translate-y-1 cursor-pointer border border-border-light hover:border-primary/20 mb-4";
        
        card.innerHTML = `
            <div class="relative h-40 sm:h-32 w-full sm:w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                ${imageHTML}
            </div>

            <div class="flex flex-1 flex-col justify-between py-1">
                <div>
                    <div class="flex justify-between items-start">
                        <h3 class="font-bold text-lg text-black leading-tight group-hover:text-primary transition-colors">${name}</h3>
                    </div>
                    
                    <div class="mt-1 flex items-center gap-1 text-xs text-text-subtle">
                        <span class="material-symbols-outlined text-[14px] text-primary">location_on</span>
                        ${item.district || 'Nakhon Pathom'}
                    </div>
                </div>

                <div class="mt-3 flex items-end justify-between">
                    <div class="text-xs text-text-subtle">${dictionary[currentLang].updated}: ${item.updated_date}</div>
                    <div class="flex flex-col items-end">
                        <span class="text-lg font-bold text-primary">${item.price}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            map.panTo({ lat: item.lat, lng: item.lng });
            map.setZoom(15);
            if(markers[index]) {
                google.maps.event.trigger(markers[index], 'click');
            }
        });

        listContainer.appendChild(card);
    });
}

// 6. ฟังก์ชันเปลี่ยนภาษา
function changeLang(lang) {
    currentLang = lang;
    
    // ปรับสไตล์ปุ่ม
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-black', 'shadow-sm');
        btn.classList.add('text-text-subtle');
    });
    const activeBtn = document.getElementById('btn-' + lang);
    activeBtn.classList.remove('text-text-subtle');
    activeBtn.classList.add('bg-white', 'text-black', 'shadow-sm');

    // เปลี่ยน Placeholder ช่องค้นหา
    document.getElementById('search-input').placeholder = dictionary[lang].search;

    renderAll(); // วาดใหม่ทั้งหมด
}

// 7. ฟังก์ชันค้นหา (แถมให้)
document.getElementById('search-input').addEventListener('keyup', (e) => {
    const term = e.target.value.toLowerCase();

    // กรองข้อมูล (Filter)
    const filteredData = fitnessData.filter(item => {
        // ค้นหาจาก ชื่อ (ไทย/อังกฤษ)
        const nameMatch = item.name.th.includes(term) || item.name.en.toLowerCase().includes(term);
        // ค้นหาจาก Tags (เช่น พิมพ์ว่า pool)
        const tagMatch = item.tags && item.tags.some(tag => tag.includes(term));
        
        return nameMatch || tagMatch;
    });

    console.log("เจอผลลัพธ์:", filteredData.length);
    // TODO: เรียกฟังก์ชัน renderSidePanel(filteredData) เพื่อวาดหน้าจอใหม่
});