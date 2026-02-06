// IndexedDB storage for large image data
const DB_NAME = "JewelAI";
const STORE_NAME = "images";

let db = null;

const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveImageToIndexedDB = async (key, imageData) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await store.put(imageData, key);
    return true;
  } catch (error) {
    console.error("Error saving image to IndexedDB:", error);
    return false;
  }
};

export const getImageFromIndexedDB = async (key) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error("Error retrieving image from IndexedDB:", error);
    return null;
  }
};

export const removeImageFromIndexedDB = async (key) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await store.delete(key);
    return true;
  } catch (error) {
    console.error("Error removing image from IndexedDB:", error);
    return false;
  }
};

export const clearAllImages = async () => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await store.clear();
    return true;
  } catch (error) {
    console.error("Error clearing images from IndexedDB:", error);
    return false;
  }
};
