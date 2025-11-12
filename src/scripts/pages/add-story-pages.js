import ApiService from '../data/api.js';

export default class AddStoryPage {
  constructor() {
    this.selectedLocation = null;
  }

  async render() {
    return `
      <section class="container">
        <h1>Tambah Cerita Baru</h1>
        <div class="add-story-container">
          <form id="add-story-form" class="story-form">
            <div class="form-group">
              <label for="description">Deskripsi Cerita</label>
              <textarea id="description" name="description" required placeholder="Ceritakan pengalaman Anda..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="photo">Foto</label>
              <input type="file" id="photo" name="photo" accept="image/*" required>
              <small>Pilih foto untuk cerita Anda (maksimal 1MB)</small>
            </div>

            <div class="form-group">
              <label>Pilih Lokasi (Opsional)</label>
              
              <div class="map-container">
                <div id="map" class="interactive-map">
                  <div class="map-placeholder">Memuat peta...</div>
                </div>
              </div>
              
              <div class="location-inputs">
                <div class="input-group">
                  <label for="lat">Latitude</label>
                  <input type="number" id="lat" step="any" placeholder="Latitude" readonly>
                </div>
                <div class="input-group">
                  <label for="lon">Longitude</label>
                  <input type="number" id="lon" step="any" placeholder="Longitude" readonly>
                </div>
              </div>
              
              <div class="quick-locations">
                <button type="button" class="btn-secondary" data-lat="-6.2088" data-lon="106.8456">Jakarta</button>
                <button type="button" class="btn-secondary" data-lat="-6.9175" data-lon="107.6191">Bandung</button>
                <button type="button" class="btn-secondary" data-lat="-7.2504" data-lon="112.7688">Surabaya</button>
                <button type="button" class="btn-secondary" id="use-current-location">Gunakan Lokasi Saat Ini</button>
              </div>
            </div>

            <button type="submit" class="btn-primary">Tambah Cerita</button>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.initializeMap();
    this.setupForm();
    this.setupLocationButtons();
  }

initializeMap() {
  const mapContainer = document.getElementById('map');
  
  mapContainer.innerHTML = `
    <div id="leaflet-map" style="height: 300px; border-radius: 8px;"></div>
    <div class="map-coordinates">
      <small>Klik di peta untuk memilih lokasi • Scroll untuk zoom</small>
    </div>
  `;

  this.loadLeafletResources().then(() => {
    this.initLeafletMap();
  }).catch(error => {
    console.error('Failed to load Leaflet:', error);
    mapContainer.innerHTML = '<div class="map-placeholder">Peta tidak dapat dimuat. Gunakan tombol lokasi di bawah.</div>';
  });
}

loadLeafletResources() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

initLeafletMap() {
  const map = L.map('leaflet-map').setView([-6.2088, 106.8456], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let marker = null;

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    
    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map);
    
    this.updateLocationInputs(lat.toFixed(6), lng.toFixed(6));
    this.showMessage(`Lokasi dipilih: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
  });

  marker = L.marker([-6.2088, 106.8456]).addTo(map);
}

  setupLocationButtons() {
    document.querySelectorAll('.quick-locations button').forEach(btn => {
      if (btn.id !== 'use-current-location') {
        btn.addEventListener('click', (e) => {
          const lat = e.target.getAttribute('data-lat');
          const lon = e.target.getAttribute('data-lon');
          this.updateLocationInputs(lat, lon);
          this.updateMapView(lat, lon);
          this.showMessage(`Lokasi ${this.getLocationName(lat, lon)} dipilih!`, 'success');
        });
      }
    });

    document.getElementById('use-current-location')?.addEventListener('click', () => {
      this.getCurrentLocation();
    });
  }

  updateMapView(lat, lon) {
    const mapContainer = document.getElementById('map');
    const iframe = mapContainer.querySelector('iframe');
    if (iframe) {
      iframe.src = `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`;
    }
  }

  updateLocationInputs(lat, lon) {
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lon;
    this.selectedLocation = { lat: parseFloat(lat), lon: parseFloat(lon) };
    
    const coordsDisplay = document.getElementById('current-coords');
    if (coordsDisplay) {
      coordsDisplay.textContent = `${lat}, ${lon}`;
      coordsDisplay.style.fontWeight = 'bold';
      coordsDisplay.style.color = '#007bff';
    }
  }

  getLocationName(lat, lon) {
    const locations = {
      '-6.2088,106.8456': 'Jakarta',
      '-6.9175,107.6191': 'Bandung', 
      '-7.2504,112.7688': 'Surabaya'
    };
    
    return locations[`${lat},${lon}`] || 'Lokasi Kustom';
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showMessage('Geolocation tidak didukung oleh browser Anda', 'error');
      return;
    }

    this.showMessage('Mendapatkan lokasi Anda...', 'info');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        this.updateLocationInputs(lat, lon);
        this.updateMapView(lat, lon);
        this.showMessage('Lokasi saat ini berhasil didapatkan!', 'success');
      },
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Akses lokasi ditolak';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage += 'Permintaan lokasi timeout';
            break;
          default:
            errorMessage += 'Error tidak diketahui';
        }
        this.showMessage(errorMessage, 'error');
      }
    );
  }

  setupForm() {
    const form = document.getElementById('add-story-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const description = document.getElementById('description').value;
      const photoInput = document.getElementById('photo');
      const photo = photoInput.files[0];
      const lat = document.getElementById('lat').value;
      const lon = document.getElementById('lon').value;

      if (!description.trim()) {
        this.showMessage('Deskripsi tidak boleh kosong', 'error');
        return;
      }

      if (!photo) {
        this.showMessage('Foto harus dipilih', 'error');
        return;
      }

      if (photo.size > 1024 * 1024) {
        this.showMessage('Ukuran foto maksimal 1MB', 'error');
        return;
      }

      if (!photo.type.startsWith('image/')) {
        this.showMessage('File harus berupa gambar', 'error');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.hash = '#/login';
          return;
        }

        const storyData = {
          description: description.trim(),
          photo: photo
        };

        if (lat && lon) {
          storyData.lat = parseFloat(lat);
          storyData.lon = parseFloat(lon);
        }

        const response = await ApiService.addStory(token, storyData);
        
        if (response.error) {
          throw new Error(response.message);
        }

        this.showMessage('Cerita berhasil ditambahkan!', 'success');
        setTimeout(() => {
          window.location.hash = '#/';
        }, 2000);
        
      } catch (error) {
        this.showMessage('Gagal menambah cerita: ' + error.message, 'error');
      }
    });
  }

  showMessage(message, type = 'info') {
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
  }

  async submitStory(description, photo, lat, lon) {
    const token = localStorage.getItem('token');
  
    if (!navigator.onLine) {
      await this.saveStoryOffline(description, photo, lat, lon);
      this.showMessage('Cerita disimpan secara offline dan akan disinkronisasi ketika online', 'info');
      setTimeout(() => {
        window.location.hash = '#/';
      }, 2000);
      return;
    }

    try {
      const storyData = {
        description: description.trim(),
        photo: photo
      };

      if (lat && lon) {
        storyData.lat = parseFloat(lat);
        storyData.lon = parseFloat(lon);
      }

      const response = await ApiService.addStory(token, storyData);
    
      if (response.error) {
        throw new Error(response.message);
      }

      this.showMessage('Cerita berhasil ditambahkan!', 'success');
      setTimeout(() => {
        window.location.hash = '#/';
      }, 2000);
    } catch (error) {
      if (!navigator.onLine) {
        await this.saveStoryOffline(description, photo, lat, lon);
        this.showMessage('Cerita disimpan secara offline karena koneksi terputus', 'info');
      } else {
        this.showMessage('Gagal menambah cerita: ' + error.message, 'error');
      }
    }
  }

  async saveStoryOffline(description, photo, lat, lon) {
    const db = new DatabaseManager();
    const storyData = {
      description: description.trim(),
      photo: photo,
      lat: lat ? parseFloat(lat) : null,
      lon: lon ? parseFloat(lon) : null,
      createdAt: new Date().toISOString(),
      synced: false
    };
  
    await db.saveStoryForSync(storyData);
  
    if ('serviceWorker' in navigator && 'sync' in registration) {
      const registration = await navigator.serviceWorker.ready;
      registration.sync.register('sync-stories');
    }
  }
}