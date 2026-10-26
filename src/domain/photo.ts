import * as ImagePicker from 'expo-image-picker';

/**
 * Abre la galería para elegir una imagen (selfie/foto). Devuelve un id simulado
 * para el prototipo (no se guarda la imagen real). `null` si se cancela.
 *
 * En web abre el selector de archivos del sistema; en móvil, la galería.
 */
export async function pickImageFromGallery(): Promise<string | null> {
  // En móvil conviene pedir permiso de galería; en web no aplica.
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted' && perm.canAskAgain === false) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) return null;
  // En el prototipo guardamos solo un id simbólico.
  return `gallery_${Date.now()}`;
}
