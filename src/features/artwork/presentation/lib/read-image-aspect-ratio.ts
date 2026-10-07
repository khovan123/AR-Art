export async function readImageAspectRatio(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    return await new Promise<number>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error("Unable to read the image dimensions."));
          return;
        }
        resolve(image.naturalWidth / image.naturalHeight);
      };
      image.onerror = () => reject(new Error("Unable to read the image."));
      image.src = imageUrl;
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
