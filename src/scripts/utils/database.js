class DatabaseManager {
  constructor() {
    this.dbName = 'StoryAppDB';
    this.version = 3;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('favorites')) {
          const store = db.createObjectStore('favorites', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains('stories')) {
          const store = db.createObjectStore('stories', { keyPath: 'id', autoIncrement: true });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async addFavorite(story) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['favorites'], 'readwrite');
        const store = transaction.objectStore('favorites');
        
        const favoriteStory = {
          id: story.id,
          name: story.name,
          description: story.description,
          photoUrl: story.photoUrl,
          lat: story.lat,
          lon: story.lon,
          createdAt: story.createdAt,
          favoritedAt: new Date().toISOString()
        };
        
        const request = store.add(favoriteStory);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw error;
    }
  }

  async removeFavorite(storyId) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['favorites'], 'readwrite');
        const store = transaction.objectStore('favorites');
        
        const request = store.delete(storyId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw error;
    }
  }

  async getFavorites() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['favorites'], 'readonly');
        const store = transaction.objectStore('favorites');
        
        const request = store.getAll();
        
        request.onsuccess = () => {
          const favorites = Array.isArray(request.result) ? request.result : [];
          resolve(favorites);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return [];
    }
  }

  async isFavorite(storyId) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['favorites'], 'readonly');
        const store = transaction.objectStore('favorites');
        
        const request = store.get(storyId);
        
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return false;
    }
  }

  async searchFavorites(query) {
    const favorites = await this.getFavorites();
    return favorites.filter(story =>
      story.description.toLowerCase().includes(query.toLowerCase()) ||
      story.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async sortFavorites(sortBy = 'createdAt', order = 'desc') {
    const favorites = await this.getFavorites();
    return favorites.sort((a, b) => {
      if (order === 'asc') {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });
  }

  async saveStoryForSync(story) {
    const db = await this.openDB();
    const transaction = db.transaction(['stories'], 'readwrite');
    const store = transaction.objectStore('stories');
    const storyToSave = {
      ...story,
      synced: false,
      createdAt: new Date().toISOString()
    };
    return store.add(storyToSave);
  }

  async getStoriesForSync() {
    const db = await this.openDB();
    const transaction = db.transaction(['stories'], 'readonly');
    const store = transaction.objectStore('stories');
    return store.getAll();
  }

  async markStoryAsSynced(storyId) {
    const db = await this.openDB();
    const transaction = db.transaction(['stories'], 'readwrite');
    const store = transaction.objectStore('stories');
    const story = await store.get(storyId);
    if (story) {
      story.synced = true;
      return store.put(story);
    }
  }

  async deleteSyncedStories() {
    const db = await this.openDB();
    const transaction = db.transaction(['stories'], 'readwrite');
    const store = transaction.objectStore('stories');
    const stories = await store.getAll();
    const deletePromises = stories
      .filter(story => story.synced)
      .map(story => store.delete(story.id));
    return Promise.all(deletePromises);
  }
}

export default DatabaseManager;