import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMPLATES_KEY = 'listingai_templates';
const USAGE_COUNT_KEY = 'listingai_usage';
const PROMO_CODE_KEY = 'listingai_promo';

// Templates
export async function saveTemplate(name, templateData) {
  try {
    const templates = await getTemplates();
    const id = Date.now().toString();
    const newTemplate = {
      id,
      name,
      ...templateData,
      savedAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return newTemplate;
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
}

export async function getTemplates() {
  try {
    const data = await AsyncStorage.getItem(TEMPLATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
}

export async function deleteTemplate(id) {
  try {
    const templates = await getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Usage count (for anonymous users)
export async function getAnonUsageCount() {
  try {
    const count = await AsyncStorage.getItem(USAGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting usage count:', error);
    return 0;
  }
}

export async function incrementAnonUsageCount() {
  try {
    const count = await getAnonUsageCount();
    const newCount = count + 1;
    await AsyncStorage.setItem(USAGE_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    throw error;
  }
}

// Promo code
export async function savePromoCode(code) {
  try {
    await AsyncStorage.setItem(PROMO_CODE_KEY, code);
  } catch (error) {
    console.error('Error saving promo code:', error);
    throw error;
  }
}

export async function getPromoCode() {
  try {
    return await AsyncStorage.getItem(PROMO_CODE_KEY);
  } catch (error) {
    console.error('Error getting promo code:', error);
    return null;
  }
}

export async function clearPromoCode() {
  try {
    await AsyncStorage.removeItem(PROMO_CODE_KEY);
  } catch (error) {
    console.error('Error clearing promo code:', error);
    throw error;
  }
}
