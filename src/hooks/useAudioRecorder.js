import { useState } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// Wait for the app to return to foreground after a system dialog
const waitForForeground = () =>
  new Promise(resolve => {
    if (AppState.currentState === 'active') {
      resolve();
      return;
    }
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {
        sub.remove();
        resolve();
      }
    });
    // Safety timeout — resolve anyway after 2s
    setTimeout(() => {
      sub.remove();
      resolve();
    }, 2000);
  });

export function useAudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.granted;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setLoading(true);
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error('Audio recording permission is required');
      }

      // Wait for app to return to foreground after the permission dialog
      // dismisses — iOS puts the app in background while the dialog is showing,
      // and Audio.setAudioModeAsync will fail if called before it's active again.
      await waitForForeground();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      setLoading(true);
      if (!recording) {
        throw new Error('No recording in progress');
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getBase64 = async uri => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return fileContent;
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  };

  const clearRecording = () => {
    setRecording(null);
    setIsRecording(false);
  };

  return {
    isRecording,
    loading,
    startRecording,
    stopRecording,
    getBase64,
    clearRecording,
  };
}
