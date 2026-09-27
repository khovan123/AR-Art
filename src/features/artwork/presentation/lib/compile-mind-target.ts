export async function compileMindTarget(
  file: File,
  onProgress: (progress: number) => void,
) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to read the target image."));
      element.src = imageUrl;
    });

    const { Compiler } = await import("mind-ar/src/image-target/compiler.js");
    const compiler = new Compiler();

    await compiler.compileImageTargets([image], (progress) => {
      onProgress(Math.round(progress));
    });

    const buffer = await compiler.exportData();
    onProgress(100);
    return new Blob([buffer], { type: "application/octet-stream" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
