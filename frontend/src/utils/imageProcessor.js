/**
 * Client-side image compression utility.
 * Scales down an image proportionally to max 1200x900px and exports as a JPEG Blob at 87% quality.
 * 
 * @param {File} file - The original image file
 * @param {number} maxWidth - Maximum width boundary
 * @param {number} maxHeight - Maximum height boundary
 * @param {number} quality - JPEG compression quality (0.0 to 1.0)
 * @returns {Promise<Blob>} A promise that resolves with the compressed image Blob
 */
export function compressImage(file, maxWidth = 1200, maxHeight = 900, quality = 0.87) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale down
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas image compression failed'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(new Error('Failed to load image element: ' + err));
    };
    reader.onerror = (err) => reject(new Error('Failed to read file: ' + err));
  });
}
