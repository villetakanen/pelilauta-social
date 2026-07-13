export async function resizeImage(file: File, maxWidth = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not create 2d context.'));
        return;
      }

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          // Create a new File with WebP extension and type
          const resizedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.webp'),
            { type: 'image/webp' },
          );
          resolve(resizedFile);
        } else {
          reject(new Error('Error creating resized image blob.'));
        }
        URL.revokeObjectURL(img.src); // Clean up
      }, 'image/webp'); // Specify 'image/webp' as the type
    };

    img.onerror = (error) => {
      reject(error);
      URL.revokeObjectURL(img.src); // Clean up
    };
  });
}
