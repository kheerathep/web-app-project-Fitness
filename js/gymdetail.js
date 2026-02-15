let gymData = {};

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

function updateGymDetails(gym, detail, lang) {
    const getLang = (obj) => obj[lang] || obj['en'];

    document.title = `${getLang(gym.name)} - NakhonFit`;
    
    // Breadcrumb
    document.getElementById('gym-name-breadcrumb').textContent = getLang(gym.name);

    // Header section
    document.getElementById('gym-name-header').textContent = getLang(gym.name);
    document.getElementById('gym-image-header').style.backgroundImage = `url('${detail.image_url}')`;
    document.getElementById('gym-description').textContent = getLang(detail.description);
    document.getElementById('gym-rating').textContent = detail.rating;
    document.getElementById('gym-reviews-count').textContent = `(${detail.reviews_count} reviews)`;

    if (detail.verified) {
        document.getElementById('verified-badge').classList.remove('hidden');
    }

    // Star ratings
    const starContainer = document.getElementById('gym-stars');
    starContainer.innerHTML = '';
    for(let i=0; i<5; i++){
        const star = document.createElement('span');
        star.className = 'material-symbols-outlined text-[20px]';
        star.style.fontVariationSettings = "'FILL' 1";
        if(i < Math.floor(detail.rating)){
            star.textContent = 'star';
        } else if (i < detail.rating){
            star.textContent = 'star_half';
        } else {
            star.textContent = 'star';
            star.classList.add('text-gray-300'); 
        }
        starContainer.appendChild(star);
    }

    // Membership Plans
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
                        ${(plan.perks || []).map(perk => `<li class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[16px]">check</span> ${perk}</li>`).join('')}
                    </ul>
                </div>
            `;
            plansContainer.appendChild(planElement);
        });
    } else {
        plansContainer.innerHTML = `<div class="text-center p-10 col-span-full text-gray-500">No membership plans available.</div>`;
    }

    // Amenities
    const amenitiesContainer = document.getElementById('amenities');
    amenitiesContainer.innerHTML = '';
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

    // Reviews
    const totalReviews = Object.values(detail.reviews.breakdown).reduce((a, b) => a + b, 0);
    document.getElementById('reviews-total-rating').textContent = detail.rating;
    document.getElementById('reviews-total-count').textContent = `${totalReviews} verified reviews`;
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
    reviewStarContainer.innerHTML = '';
     for(let i=0; i<5; i++){
        const star = document.createElement('span');
        star.className = 'material-symbols-outlined text-[24px]';
        star.style.fontVariationSettings = "'FILL' 1";
        if(i < Math.floor(detail.rating)){
            star.textContent = 'star';
        } else if (i < detail.rating){
            star.textContent = 'star_half';
        } else {
            star.textContent = 'star';
            star.classList.add('text-gray-300');
        }
        reviewStarContainer.appendChild(star);
    }

    // Contact & Location
    document.getElementById('contact-phone').textContent = gym.contact;
     document.getElementById('contact-phone').href = `tel:${gym.contact}`;
    document.getElementById('contact-website').href = gym.website;
    document.getElementById('contact-website').textContent = getLang(gym.name);
    document.getElementById('location-name').textContent = getLang(gym.name);
    document.getElementById('location-address').textContent = getLang(detail.address);
    document.getElementById('open-in-maps').href = `https://www.google.com/maps/search/?api=1&query=${gym.lat},${gym.lng}`;
    document.getElementById('get-directions-btn').href = `https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lng}`;

    // Opening Hours
    const hoursStatus = document.getElementById('opening-hours-status');
    const statusText = getLang(detail.opening_hours.status);
    hoursStatus.textContent = statusText;
    if (statusText.toLowerCase().includes('open') || statusText.includes('เปิด')) {
        hoursStatus.className = 'text-xs font-bold border px-2 py-0.5 rounded-full text-green-700 bg-green-50 border-green-200';
    } else {
        hoursStatus.className = 'text-xs font-bold border px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 border-gray-200';
    }
    const hoursDaysContainer = document.getElementById('opening-hours-days');
    hoursDaysContainer.innerHTML = '';
    for (const [day, time] of Object.entries(detail.opening_hours.days)) {
        const div = document.createElement('div');
        div.className = 'flex justify-between';
        div.innerHTML = `<span>${day}</span><span class="text-black font-medium">${time}</span>`;
        hoursDaysContainer.appendChild(div);
    }
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
