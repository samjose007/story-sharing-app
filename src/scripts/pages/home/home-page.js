import ApiService from '../../data/api.js';
import { showFormattedDate } from '../../utils/index.js';
import DatabaseManager from '../../utils/database.js';
import NotificationManager from '../../utils/notification.js';

export default class HomePage {
  constructor() {
    this.stories = [];
    this.filteredStories = [];
    this.db = new DatabaseManager();
    this.currentFilter = 'all';
    this.currentSort = 'newest';
    this.searchQuery = '';
  }

  async render() {
    return `
      <section class="container">
        <div class="page-header">
          <h1>Homepage</h1>
          <div class="header-actions">
            <button id="refresh-btn" class="btn-secondary">Refresh</button>
            <button id="favorites-btn" class="btn-secondary">Favorit</button>
            <button id="notification-toggle" class="btn-secondary">Notifikasi</button>
          </div>
        </div>

        <div class="filters-container">
          <div class="search-box">
            <input type="text" id="search-input" placeholder="Cari cerita..." class="search-input">
            <button id="search-btn" class="btn-secondary">Cari</button>
          </div>
          <div class="filter-controls">
            <select id="filter-select" class="filter-select">
              <option value="all">Semua Cerita</option>
              <option value="favorites">Favorit Saja</option>
              <option value="with-location">Dengan Lokasi</option>
            </select>
            <select id="sort-select" class="filter-select">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name">Nama User</option>
            </select>
          </div>
        </div>

        <div class="stories-container">
          <div class="stories-list" id="stories-list">
            <div class="loading">Loading stories...</div>
          </div>
          <div class="map-container">
            <h3>Story Locations</h3>
            <div id="map" class="simple-map">
              <p class="map-placeholder">Map will appear here. Click "View Location" on stories that have location.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      await this.loadStories();
      await this.displayStories();
      this.setupEventListeners();
      await this.initializeNotifications();
    } catch (error) {
      console.error('Error in afterRender:', error);
    }
  }

  async initializeNotifications() {
    const notificationToggle = document.getElementById('notification-toggle');
    if (!notificationToggle) return;

    try {
      await NotificationManager.registerServiceWorker();
      this.updateNotificationButton();
      
      notificationToggle.addEventListener('click', async () => {
        await this.toggleNotifications();
      });
    } catch (error) {
      notificationToggle.style.display = 'none';
    }
  }

  async updateNotificationButton() {
    const button = document.getElementById('notification-toggle');
    if (!button) return;

    try {
      const isSubscribed = await NotificationManager.isSubscribed();
      button.textContent = isSubscribed ? 'Matikan Notifikasi' : 'Aktifkan Notifikasi';
    } catch (error) {
      button.style.display = 'none';
    }
  }

  async toggleNotifications() {
    try {
      const isSubscribed = await NotificationManager.isSubscribed();
      
      if (isSubscribed) {
        await NotificationManager.unsubscribeFromPush();
        this.showMessage('Notifikasi dinonaktifkan', 'info');
      } else {
        const permission = await NotificationManager.requestNotificationPermission();
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          await NotificationManager.subscribeToPush(registration);
          this.showMessage('Notifikasi diaktifkan', 'success');
        } else {
          this.showMessage('Izin notifikasi ditolak', 'error');
        }
      }
      
      this.updateNotificationButton();
    } catch (error) {
      this.showMessage('Gagal mengubah pengaturan notifikasi', 'error');
    }
  }

  setupEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', async () => {
      await this.loadStories();
      this.applyFilters();
    });

    document.getElementById('favorites-btn').addEventListener('click', () => {
      this.showFavoritesPage();
    });

    document.getElementById('search-btn').addEventListener('click', () => {
      this.searchStories();
    });

    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchStories();
      }
    });

    document.getElementById('filter-select').addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.applyFilters();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.applyFilters();
    });
  }

  async searchStories() {
    this.searchQuery = document.getElementById('search-input').value;
    this.applyFilters();
  }

  async applyFilters() {
    let filtered = [...this.stories];

    if (this.searchQuery) {
      filtered = filtered.filter(story => 
        story.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        story.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    if (this.currentFilter === 'favorites') {
      const favorites = await this.db.getFavorites();
      const favoriteIds = favorites.map(fav => fav.id);
      filtered = filtered.filter(story => favoriteIds.includes(story.id));
    } else if (this.currentFilter === 'with-location') {
      filtered = filtered.filter(story => story.lat && story.lon);
    }

    if (this.currentSort === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (this.currentSort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (this.currentSort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filteredStories = filtered;
    await this.displayStories();
  }

  async displayStories() {
    const storiesList = document.getElementById('stories-list');
    if (!storiesList) return;

    if (this.filteredStories.length === 0) {
      const message = this.currentFilter === 'favorites' 
        ? 'Belum ada cerita favorit.' 
        : 'Tidak ada cerita yang sesuai dengan filter.';
      storiesList.innerHTML = `<div class="no-stories">${message}</div>`;
      return;
    }
    
    const storiesHTML = [];
    
    for (let i = 0; i < this.filteredStories.length; i++) {
      const story = this.filteredStories[i];
      const isFav = await this.db.isFavorite(story.id);
        
      storiesHTML.push(`
        <div class="story-item ${isFav ? 'favorite' : ''}" data-story-id="${story.id}">
          <img src="${story.photoUrl}" alt="${story.description}">
          <div class="story-content">
            <p class="story-description">${story.description}</p>
            <span class="story-date">${showFormattedDate(story.createdAt)}</span>
            <span class="story-user">By: ${story.name}</span>
            <div class="story-actions">
              <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-id="${story.id}">
                ${isFav ? '❤️ Hapus Favorit' : '🤍 Tambah Favorit'}
              </button>
              ${story.lat && story.lon ?
                `<button class="show-location-btn" data-lat="${story.lat}" data-lon="${story.lon}">
                  View Location
                </button>` :
                ''
              }
            </div>
          </div>
        </div>
      `);
    }

    storiesList.innerHTML = storiesHTML.join('');
    this.setupStoryActions();
  }

  setupStoryActions() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const storyId = e.target.getAttribute('data-id');
        const story = this.stories.find(s => s.id === storyId);
        const isFavorited = e.target.classList.contains('favorited');

        try {
          if (isFavorited) {
            await this.db.removeFavorite(storyId);
            e.target.textContent = '🤍 Tambah Favorit';
            e.target.classList.remove('favorited');
            e.target.closest('.story-item').classList.remove('favorite');
            this.showMessage('Dihapus dari favorit', 'info');
          } else {
            await this.db.addFavorite(story);
            e.target.textContent = '❤️ Hapus Favorit';
            e.target.classList.add('favorited');
            e.target.closest('.story-item').classList.add('favorite');
            this.showMessage('Ditambahkan ke favorit', 'success');
          }

          if (this.currentFilter === 'favorites') {
            await this.applyFilters();
          }
        } catch (error) {
          console.error('Error toggling favorite:', error);
          this.showMessage('Gagal mengubah favorit: ' + error.message, 'error');
        }
      });
    });

    document.querySelectorAll('.show-location-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lat = e.target.getAttribute('data-lat');
        const lon = e.target.getAttribute('data-lon');
        this.showLocationOnMap(lat, lon);
      });
    });
  }

  async showFavoritesPage() {
    try {
      const favorites = await this.db.getFavorites();
      const storiesList = document.getElementById('stories-list');
      
      if (!favorites || favorites.length === 0) {
        storiesList.innerHTML = '<div class="no-stories">Belum ada cerita favorit.</div>';
        return;
      }

      const favoritesHTML = favorites.map(story => `
        <div class="story-item favorite" data-story-id="${story.id}">
          <img src="${story.photoUrl}" alt="${story.description}">
          <div class="story-content">
            <p class="story-description">${story.description}</p>
            <span class="story-date">${showFormattedDate(story.createdAt)} • Favorited: ${showFormattedDate(story.favoritedAt)}</span>
            <span class="story-user">By: ${story.name}</span>
            <div class="story-actions">
              <button class="favorite-btn favorited" data-id="${story.id}">
                ❤️ Hapus Favorit
              </button>
              ${story.lat && story.lon ?
                `<button class="show-location-btn" data-lat="${story.lat}" data-lon="${story.lon}">
                  View Location
                </button>` :
                ''
              }
            </div>
          </div>
        </div>
      `).join('');

      storiesList.innerHTML = favoritesHTML;
      this.setupStoryActions();
    } catch (error) {
      console.error('Error showing favorites:', error);
      this.showMessage('Gagal memuat favorit: ' + error.message, 'error');
    }
  }

  async loadStories() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.hash = '#/login';
        return;
      }

      const response = await ApiService.getStories(token);
      if (response.error) {
        throw new Error(response.message);
      }

      this.stories = response.listStory || [];
      this.filteredStories = [...this.stories];
    } catch (error) {
      this.showMessage('Failed to load stories: ' + error.message, 'error');
    }
  }

  showLocationOnMap(lat, lon) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    mapContainer.innerHTML = `
      <div class="map-embed">
        <iframe
          width="100%"
          height="300"
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          src="https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed"
        >
        </iframe>
        <div class="map-coordinates">
          <small>Coordinates: ${lat}, ${lon}</small>
        </div>
      </div>
    `;
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
  }
}