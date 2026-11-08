import * as ImagePicker from 'expo-image-picker';
// The system photo picker grants access only to selected items; no broad library/camera permission is requested.
export async function pickProfileImage() {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false,
    allowsEditing: false, quality: 1, preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible });
  return result.canceled ? null : result.assets[0] ?? null;
}
