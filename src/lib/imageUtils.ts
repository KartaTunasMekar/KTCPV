/**
 * Fungsi untuk mengompres dan mengkonversi gambar ke base64
 * @param file File gambar yang akan diproses
 * @returns Promise<string> URL base64 dari gambar yang sudah dikompresi
 */
export const compressAndConvertToBase64 = async (file: File): Promise<string> => {
  try {
    // Buat canvas untuk kompresi
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Buat promise untuk menunggu gambar selesai dimuat
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
    });

    // Load gambar dari file
    img.src = URL.createObjectURL(file);
    await imageLoadPromise;

    // Hitung dimensi yang diinginkan (maksimal 800x800)
    const MAX_SIZE = 800;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }
    }

    // Set ukuran canvas
    canvas.width = width;
    canvas.height = height;

    // Gambar ke canvas dengan ukuran baru
    ctx?.drawImage(img, 0, 0, width, height);

    // Konversi ke base64 dengan kualitas 0.7 (70%)
    const base64String = canvas.toDataURL('image/jpeg', 0.7);

    // Bersihkan URL object
    URL.revokeObjectURL(img.src);

    return base64String;
  } catch (error) {
    console.error('Error saat mengompres gambar:', error);
    throw new Error('Gagal mengompres dan mengkonversi gambar');
  }
}; 