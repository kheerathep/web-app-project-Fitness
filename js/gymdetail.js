let gymData = {};
const translations = {
    cn: {
        "Home": "主页",
        "Map": "地图",
        "Loading...": "加载中...",
        "BACK TO MAP": "返回地图",
        "Loading Gym...": "加载健身房...",
        "VERIFIED": "已验证",
        "Loading details...": "加载详情...",
        "reviews": "评论",
        "Get Directions": "获取路线",
        "Membership Plans": "会员计划",
        "Prices updated recently": "价格最近更新",
        "Loading plans...": "加载计划中...",
        "Facilities & Amenities": "设施与便利设施",
        "Loading amenities...": "加载便利设施中...",
        "Member Reviews": "会员评论",
        "verified reviews": "条经验证的评论",
        "Contact Information": "联系信息",
        "Phone": "电话",
        "Website": "网站",
        "Open in Maps": "在地图中打开",
        "Opening Hours": "营业时间",
        "LOADING": "加载中",
        "No membership plans available.": "没有可用的会员计划。",
        'NakhonFit - Gym Details': 'NakhonFit - 健身房详情',
        '© 2024 NakhonFit. All rights reserved.': '© 2024 NakhonFit. 版权所有。'
    },
    th: {
        "Home": "หน้าหลัก",
        "Map": "แผนที่",
        "Loading...": "กำลังโหลด...",
        "BACK TO MAP": "กลับไปที่แผนที่",
        "Loading Gym...": "กำลังโหลดโรงยิม...",
        "VERIFIED": "ตรวจสอบแล้ว",
        "Loading details...": "กำลังโหลดรายละเอียด...",
        "reviews": "รีวิว",
        "Get Directions": "ขอเส้นทาง",
        "Membership Plans": "แผนสมาชิก",
        "Prices updated recently": "ราคาอัพเดทล่าสุด",
        "Loading plans...": "กำลังโหลดแผน...",
        "Facilities & Amenities": "สิ่งอำนวยความสะดวกและสิ่งอำนวยความสะดวก",
        "Loading amenities...": "กำลังโหลดสิ่งอำนวยความสะดวก...",
        "Member Reviews": "รีวิวจากสมาชิก",
        "verified reviews": "รีวิวที่ตรวจสอบแล้ว",
        "Contact Information": "ข้อมูลติดต่อ",
        "Phone": "โทรศัพท์",
        "Website": "เว็บไซต์",
        "Open in Maps": "เปิดในแผนที่",
        "Opening Hours": "เวลาทำการ",
        "LOADING": "กำลังโหลด",
        "No membership plans available.": "ไม่มีแผนสมาชิก",
        'NakhonFit - Gym Details': 'NakhonFit - รายละเอียดโรงยิม',
        '© 2024 NakhonFit. All rights reserved.': '© 2024 NakhonFit. สงวนลิขสิทธิ์'
    }
};

// This function will be called by the Google Maps script once it's loaded
function initGymMap() {
    const params = new URLSearchParams(window.location.search);
    const gymId = params.get('id');
    const lang = params.get('lang') || 'th';

    if (gymId) {
        Promise.all([
            fetch('data/data.json').then(res => res.json()),
            fetch('data/gym-details.json').then(res => res.json())
        ]).then(([gyms, details]) => {
            const gym = gyms.find(g => g.id == gymId);
            const detail = details.find(d => d.id == gymId);

            if (gym && detail) {
                gymData.gym = gym;
                gymData.detail = detail;
                gymData.lang = lang;

                // Once data is loaded, create the map
                createMap(gym);
                // Update the rest of the page content
                updateGymDetails(gym, detail, lang);
                setupLangButtons(gymId, lang);
            } else {
                console.error('Gym not found');
                document.body.innerHTML = '<h1 style="text-align:center; margin-top: 50px;">Gym not found</h1>';
            }
        }).catch(error => {
            console.error('Error fetching data:', error);
            document.body.innerHTML = '<h1 style="text-align:center; margin-top: 50px;">Error loading gym data</h1>';
        });
    }
}

function createMap(gym) {
    const mapElement = document.getElementById('gym-detail-map');
    if (!mapElement) return;

    const gymLocation = { lat: gym.lat, lng: gym.lng };

    const map = new google.maps.Map(mapElement, {
        zoom: 15,
        center: gymLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [{ "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] }]
    });

    new google.maps.Marker({
        position: gymLocation,
        map: map,
        title: gym.name[gymData.lang] || gym.name['en']
    });
}

function createStarRating(container, rating, size) {
    container.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const starWrapper = document.createElement('div');
        starWrapper.style.position = 'relative';
        starWrapper.style.display = 'inline-block';
        starWrapper.style.fontSize = `${size}px`;

        const bgStar = document.createElement('span');
        bgStar.className = 'material-symbols-outlined';
        bgStar.textContent = 'star';
        bgStar.style.fontVariationSettings = "'FILL' 1";
        bgStar.style.color = 'rgb(209, 213, 219)'; // gray-300

        starWrapper.appendChild(bgStar);

        const fillPercentage = Math.max(0, Math.min(1, rating - i)) * 100;

        if (fillPercentage > 0) {
            const fgStarContainer = document.createElement('div');
            fgStarContainer.style.position = 'absolute';
            fgStarContainer.style.top = '0';
            fgStarContainer.style.left = '0';
            fgStarContainer.style.width = `${fillPercentage}%`;
            fgStarContainer.style.height = '100%';
            fgStarContainer.style.overflow = 'hidden';

            const fgStar = document.createElement('span');
            fgStar.className = 'material-symbols-outlined';
            fgStar.textContent = 'star';
            fgStar.style.fontVariationSettings = "'FILL' 1";
            fgStar.style.color = 'rgb(250, 204, 21)'; // yellow-400
            
            fgStarContainer.appendChild(fgStar);
            starWrapper.appendChild(fgStarContainer);
        }
        container.appendChild(starWrapper);
    }
}

function updateGymDetails(gym, detail, lang) {
    const getLang = (obj) => {
        if (typeof obj === 'string') {
            if (translations[lang] && translations[lang][obj]) {
                return translations[lang][obj];
            }
            return obj;
        }
        return obj[lang] || obj['en'];
    };

    document.title = getLang('NakhonFit - Gym Details');
    
    // Breadcrumb
    document.querySelector('main a[href="/"]').textContent = getLang('Home');
    document.querySelector('a[href="map.html"]').textContent = getLang('Map');
    document.getElementById('gym-name-breadcrumb').textContent = getLang(gym.name);

    // The back to map button
    document.querySelector('.flex.items-center.gap-2.px-4.py-2.bg-black.text-white.rounded-full.text-sm.font-bold').childNodes[2].textContent = ` ${getLang('BACK TO MAP')}`;

    // Header section
    document.getElementById('gym-name-header').textContent = getLang(gym.name);
    document.getElementById('gym-image-header').style.backgroundImage = `url('${detail.image_url}')`;
    document.getElementById('gym-description').textContent = getLang(detail.description);
    document.getElementById('gym-rating').textContent = detail.rating;
    document.getElementById('gym-reviews-count').textContent = `(${detail.reviews_count} ${getLang('reviews')})`;

    if (detail.verified) {
        const verifiedBadge = document.getElementById('verified-badge');
        verifiedBadge.textContent = getLang('VERIFIED');
        verifiedBadge.classList.remove('hidden');
    }

    // Star ratings
    const starContainer = document.getElementById('gym-stars');
    createStarRating(starContainer, detail.rating, 20);

    // Membership Plans
    document.querySelector('section:nth-of-type(1) h2').textContent = getLang('Membership Plans');
    const pricesUpdatedElement = document.querySelector('section:nth-of-type(1) .text-primary.text-sm.font-bold');
    pricesUpdatedElement.innerHTML = `<span class="material-symbols-outlined text-[16px]">verified_user</span> ${getLang('Prices updated recently')}`;

    const plansContainer = document.getElementById('membership-plans');
    plansContainer.innerHTML = '';
    if(detail.plans && detail.plans.length > 0){
        detail.plans.forEach(plan => {
            const planElement = document.createElement('div');
            planElement.className = 'bg-white p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all border border-gray-200 hover:border-black group';
            planElement.innerHTML = `
                <div>
                    <h3 class="text-black text-sm font-bold uppercase tracking-wider mb-2">${getLang(plan.name)}</h3>
                    <div class="flex items-baseline gap-1 mb-4">
                        <span class="text-primary text-3xl font-black">${getLang(plan.price)}</span>
                    </div>
                    <ul class="text-gray-600 text-sm space-y-2 mb-6">
                        ${(plan.perks || []).map(perk => `<li class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[16px]">check</span> ${getLang(perk)}</li>`).join('')}
                    </ul>
                </div>
            `;
            plansContainer.appendChild(planElement);
        });
    } else {
        plansContainer.innerHTML = `<div class="text-center p-10 col-span-full text-gray-500">${getLang('No membership plans available.')}</div>`;
    }

    // Amenities
    document.querySelector('section:nth-of-type(2) h2').textContent = getLang('Facilities & Amenities');
    const amenitiesContainer = document.getElementById('amenities');
    amenitiesContainer.innerHTML = '';
    if(detail.amenities && detail.amenities.length > 0) {
        detail.amenities.forEach(amenity => {
            const amenityElement = document.createElement('div');
            amenityElement.className = 'bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-3 text-center hover:bg-white hover:shadow-lg transition-all group border border-transparent hover:border-gray-200';
            amenityElement.innerHTML = `
                <div class="size-12 rounded-full bg-white flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                    <span class="material-symbols-outlined">${amenity.icon}</span>
                </div>
                <span class="text-black text-sm font-bold">${getLang(amenity.name)}</span>
            `;
            amenitiesContainer.appendChild(amenityElement);
        });
    } else {
        amenitiesContainer.innerHTML = `<div class="text-center p-10 col-span-full text-gray-500">${getLang('Loading amenities...')}</div>`;
    }


    // Reviews
    document.querySelector('section:nth-of-type(3) h2').textContent = getLang('Member Reviews');
    const totalReviews = Object.values(detail.reviews.breakdown).reduce((a, b) => a + b, 0);
    document.getElementById('reviews-total-rating').textContent = detail.rating;
    document.getElementById('reviews-total-count').textContent = `${totalReviews} ${getLang('verified reviews')}`;
    document.getElementById('star-5-percent').textContent = `${Math.round((detail.reviews.breakdown['5_star'] / totalReviews) * 100)}%`;
    document.getElementById('star-5-bar').style.width = `${(detail.reviews.breakdown['5_star'] / totalReviews) * 100}%`;
    document.getElementById('star-4-percent').textContent = `${Math.round((detail.reviews.breakdown['4_star'] / totalReviews) * 100)}%`;
    document.getElementById('star-4-bar').style.width = `${(detail.reviews.breakdown['4_star'] / totalReviews) * 100}%`;
    document.getElementById('star-3-percent').textContent = `${Math.round((detail.reviews.breakdown['3_star'] / totalReviews) * 100)}%`;
    document.getElementById('star-3-bar').style.width = `${(detail.reviews.breakdown['3_star'] / totalReviews) * 100}%`;
    document.getElementById('star-2-percent').textContent = `${Math.round((detail.reviews.breakdown['2_star'] / totalReviews) * 100)}%`;
    document.getElementById('star-2-bar').style.width = `${(detail.reviews.breakdown['2_star'] / totalReviews) * 100}%`;
    document.getElementById('star-1-percent').textContent = `${Math.round((detail.reviews.breakdown['1_star'] / totalReviews) * 100)}%`;
    document.getElementById('star-1-bar').style.width = `${(detail.reviews.breakdown['1_star'] / totalReviews) * 100}%`;

    const reviewStarContainer = document.getElementById('reviews-stars');
    createStarRating(reviewStarContainer, detail.rating, 24);

    // Contact & Location
    document.querySelector('.bg-white.rounded-3xl.p-6 .text-black.text-lg.font-black').textContent = getLang('Contact Information');
    document.querySelector('.flex.items-center.gap-4:nth-of-type(1) .text-xs.font-bold').textContent = getLang('Phone');
    document.querySelector('.flex.items-center.gap-4:nth-of-type(2) .text-xs.font-bold').textContent = getLang('Website');
    document.getElementById('contact-phone').textContent = gym.contact;
     document.getElementById('contact-phone').href = `tel:${gym.contact}`;
    document.getElementById('contact-website').href = gym.website;
    document.getElementById('contact-website').textContent = getLang(gym.name);
    document.getElementById('location-name').textContent = getLang(gym.name);
    document.getElementById('location-address').textContent = getLang(detail.address);
    document.getElementById('open-in-maps').innerHTML = `<span class="material-symbols-outlined text-[20px]">near_me</span> ${getLang('Open in Maps')}`;
    document.getElementById('get-directions-btn').innerHTML = `<span class="material-symbols-outlined">directions</span><span>${getLang('Get Directions')}</span>`;


    // Opening Hours
    const hoursStatus = document.getElementById('opening-hours-status');
    const statusText = getLang(detail.opening_hours.status);
    hoursStatus.textContent = statusText;
    if (statusText.toLowerCase().includes('open') || statusText.includes('เปิด') || statusText.toLowerCase().includes('营业中')) {
        hoursStatus.className = 'text-xs font-bold border px-2 py-0.5 rounded-full text-green-700 bg-green-50 border-green-200';
    } else {
        hoursStatus.className = 'text-xs font-bold border px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 border-gray-200';
    }

    document.querySelector('.space-y-4.pt-4.border-t .text-black.text-sm.font-bold').textContent = getLang('Opening Hours');
    const hoursDaysContainer = document.getElementById('opening-hours-days');
    hoursDaysContainer.innerHTML = '';
    detail.opening_hours.days.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex justify-between';
        div.innerHTML = `<span>${getLang(item.day)}</span><span class="text-black font-medium">${getLang(item.time)}</span>`;
        hoursDaysContainer.appendChild(div);
    });

    // Footer
    document.querySelector('footer p').textContent = getLang('© 2024 NakhonFit. All rights reserved.');
}

function setupLangButtons(gymId, currentLang) {
    const langContainer = document.getElementById('lang-switcher');
    const langs = ['en', 'th', 'cn'];
    langContainer.innerHTML = '';

    langs.forEach(lang => {
        const button = document.createElement('a');
        button.href = `gymdetail.html?id=${gymId}&lang=${lang}`;
        button.className = 'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition ';
        if (lang === currentLang) {
            button.classList.add('bg-white', 'text-black', 'shadow-sm');
        } else {
            button.classList.add('hover:bg-gray-200', 'text-gray-500');
        }
        button.innerHTML = `<span>${lang.toUpperCase()}</span>`;
        langContainer.appendChild(button);
    });
}
