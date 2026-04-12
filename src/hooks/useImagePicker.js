import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const MAX_PHOTOS = 15;
const MAX_DIMENSION = 1200;
const QUALITY = 0.7;

async function compressImage(uri) {
  try {
    const base64String = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      uri: uri,
      base64: base64String,
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

export function useImagePicker() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickFromLibrary = async () => {
    try {
      setLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Photo library permission is required');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: QUALITY,
      });

      if (!result.canceled && result.assets) {
        await addPhotos(result.assets);
      }
    } catch (error) {
      console.error('Error picking from library:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickFromCamera = async () => {
    try {
      setLoading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission is required');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: QUALITY,
      });

      if (!result.canceled && result.assets) {
        await addPhotos(result.assets);
      }
    } catch (error) {
      console.error('Error picking from camera:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPhotos = async assets => {
    try {
      const availableSlots = MAX_PHOTOS - photos.length;
      const assetsToAdd = assets.slice(0, availableSlots);

      const processedPhotos = await Promise.all(
        assetsToAdd.map(asset => compressImage(asset.uri))
      );

      setPhotos(prev => [...prev, ...processedPhotos]);
    } catch (error) {
      console.error('Error adding photos:', error);
    }
  };

  const removePhoto = index => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const clearPhotos = () => {
    setPhotos([]);
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return {
    photos,
    loading,
    pickFromLibrary,
    pickFromCamera,
    removePhoto,
    clearPhotos,
    canAddMore,
    photoCount: photos.length,
    maxPhotos: MAX_PHOTOS,
  };
}
