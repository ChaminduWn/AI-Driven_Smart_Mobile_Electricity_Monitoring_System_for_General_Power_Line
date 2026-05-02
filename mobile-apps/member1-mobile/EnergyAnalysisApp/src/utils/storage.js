/**
 * Wrapper for AsyncStorage that works reliably in Expo web
 * Falls back to direct localStorage if AsyncStorage fails in web environment
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

class StorageManager {
  async setItem(key, value) {
    try {
      console.log(`💾 StorageManager.setItem("${key}", ...)`);
      await AsyncStorage.setItem(key, value);
      
      // In web, also ensure it's in localStorage as backup
      if (isWeb) {
        localStorage.setItem(key, value);
        console.log(`   ✓ Stored in AsyncStorage and localStorage`);
      } else {
        console.log(`   ✓ Stored in AsyncStorage`);
      }
      return true;
    } catch (e) {
      console.error(`❌ Failed to setItem("${key}"):`, e.message);
      
      // Fallback to localStorage
      if (isWeb) {
        try {
          localStorage.setItem(key, value);
          console.log(`   ✓ Fallback: stored in localStorage only`);
          return true;
        } catch (err) {
          console.error(`❌ Fallback also failed:`, err.message);
          return false;
        }
      }
      throw e;
    }
  }

  async getItem(key) {
    try {
      // Try AsyncStorage first
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log(`✓ Retrieved from AsyncStorage: ${key}`);
        return value;
      }
      
      // Fall back to localStorage in web
      if (isWeb) {
        const localValue = localStorage.getItem(key);
        if (localValue) {
          console.log(`✓ Retrieved from localStorage (fallback): ${key}`);
          // Sync back to AsyncStorage
          try {
            await AsyncStorage.setItem(key, localValue);
          } catch (_) {}
          return localValue;
        }
      }
      
      console.log(`⚠️  Key not found: ${key}`);
      return null;
    } catch (e) {
      console.error(`❌ Failed to getItem("${key}"):`, e.message);
      
      // Last resort: try localStorage,ONLY in web
      if (isWeb) {
        try {
          const value = localStorage.getItem(key);
          console.log(`   Fallback retrieval from localStorage: ${value ? 'FOUND' : 'NOT FOUND'}`);
          return value;
        } catch (_) {}
      }
      
      return null;
    }
  }

  async multiSet(entries) {
    try {
      console.log(`💾 StorageManager.multiSet([${entries.map(e => e[0]).join(', ')}])`);
      await AsyncStorage.multiSet(entries);
      
      // Also set in localStorage for web
      if (isWeb) {
        entries.forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        console.log(`   ✓ Stored all items in AsyncStorage and localStorage`);
      } else {
        console.log(`   ✓ Stored all items in AsyncStorage`);
      }
      return true;
    } catch (e) {
      console.error(`❌ Failed to multiSet:`, e.message);
      
      // Fallback: try localStorage only
      if (isWeb) {
        try {
          entries.forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
          console.log(`   ✓ Fallback: stored all items in localStorage only`);
          return true;
        } catch (err) {
          console.error(`❌ Fallback failed:`, err.message);
          return false;
        }
      }
      throw e;
    }
  }

  async multiGet(keys) {
    try {
      const result = await AsyncStorage.multiGet(keys);
      
      // Check if all values were found
      const allFound = result.every(([_k, v]) => v !== null);
      if (allFound) {
        console.log(`✓ Retrieved [${keys.join(', ')}] from AsyncStorage`);
        return result;
      }
      
      // Fall back to localStorage in web
      if (isWeb) {
        const localResult = keys.map(key => [
          key,
          localStorage.getItem(key),
        ]);
        
        const localAllFound = localResult.every(([_k, v]) => v !== null);
        if (localAllFound) {
          console.log(`✓ Retrieved [${keys.join(', ')}] from localStorage (fallback)`);
          // Sync back to AsyncStorage
          try {
            await AsyncStorage.multiSet(localResult.filter(([_k, v]) => v !== null));
          } catch (_) {}
          return localResult;
        }
      }
      
      console.log(`⚠️  Some keys not found: [${keys.join(', ')}]`);
      return result;
    } catch (e) {
      console.error(`❌ Failed to multiGet([${keys.join(', ')}]):`, e.message);
      
      // Last resort: try localStorage ONLY in web
      if (isWeb) {
        try {
          const localResult = keys.map(key => [key, localStorage.getItem(key)]);
          console.log(`   Fallback multiGet: found ${localResult.filter(([_k, v]) => v).length}/${keys.length} items`);
          return localResult;
        } catch (_) {}
      }
      
      return keys.map(k => [k, null]);
    }
  }

  async removeItem(key) {
    try {
      console.log(`🗑️  StorageManager.removeItem("${key}")`);
      await AsyncStorage.removeItem(key);
      
      if (isWeb) {
        localStorage.removeItem(key);
      }
      console.log(`   ✓ Item removed`);
    } catch (e) {
      console.error(`❌ Failed to removeItem("${key}"):`, e.message);
      if (isWeb) {
        localStorage.removeItem(key);
      }
    }
  }

  async multiRemove(keys) {
    try {
      console.log(`🗑️  StorageManager.multiRemove([${keys.join(', ')}])`);
      await AsyncStorage.multiRemove(keys);
      
      if (isWeb) {
        keys.forEach(k => localStorage.removeItem(k));
      }
      console.log(`   ✓ Items removed`);
    } catch (e) {
      console.error(`❌ Failed to multiRemove:`, e.message);
      if (isWeb) {
        keys.forEach(k => localStorage.removeItem(k));
      }
    }
  }

  async clear() {
    try {
      console.log(`🗑️  StorageManager.clear()`);
      await AsyncStorage.clear();
      
      if (isWeb) {
        localStorage.clear();
      }
      console.log(`   ✓ Storage cleared`);
    } catch (e) {
      console.error(`❌ Failed to clear storage:`, e.message);
      if (isWeb) {
        localStorage.clear();
      }
    }
  }

  // Debug function
  async dumpAll() {
    console.log('📋 Storage dump:');
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log(`   Keys in AsyncStorage: [${keys.join(', ')}]`);
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`   ${key}: ${value?.slice(0, 50) || 'null'}${value && value.length > 50 ? '...' : ''}`);
      }
    } catch (e) {
      console.error('   Error dumping storage:', e.message);
    }
    
    if (isWeb) {
      console.log(`   Keys in localStorage: [${Object.keys(localStorage).join(', ')}]`);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`   ${key}: ${value?.slice(0, 50) || 'null'}${value && value.length > 50 ? '...' : ''}`);
      }
    }
  }
}

export default new StorageManager();
