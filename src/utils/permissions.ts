import { NativeModules } from 'react-native';

const { ManageExternalStorage } = NativeModules;

export async function checkPermission(): Promise<boolean> {
  if (!ManageExternalStorage) {
    console.error('ManageExternalStorage native module is not linked.');
    return false;
  }

  const hasPermission = await ManageExternalStorage.hasPermission();
  if (!hasPermission) {
    await requestPermission();
    return false;
  }
  return true;
}

async function requestPermission(): Promise<void> {
  if (!ManageExternalStorage) {
    console.error('ManageExternalStorage native module is not linked.');
    return;
  }
  ManageExternalStorage.requestPermission();
}
