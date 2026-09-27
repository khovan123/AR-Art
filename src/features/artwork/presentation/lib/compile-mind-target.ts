const MINDAR_COMPILER_SRC =
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";

type CompilerInstance = {
  compileImageTargets(
    images: HTMLImageElement[],
    onProgress?: (progress: number) => void,
  ): Promise<unknown[]>;
  exportData(): Promise<ArrayBuffer>;
};

type CompilerConstructor = new () => CompilerInstance;

type MindArGlobal = {
  IMAGE?: {
    Compiler?: CompilerConstructor;
  };
  Compiler?: CompilerConstructor;
};

function getCompilerConstructor() {
  const mindAr = (
    window as typeof window & {
      MINDAR?: MindArGlobal;
    }
  ).MINDAR;

  return mindAr?.IMAGE?.Compiler ?? mindAr?.Compiler;
}

async function loadMindArCompiler() {
  const existing = getCompilerConstructor();
  if (existing) return existing;

  await new Promise<void>((resolve, reject) => {
    const prior = document.querySelector<HTMLScriptElement>(
      `script[data-mindar-compiler="${MINDAR_COMPILER_SRC}"]`,
    );

    if (prior) {
      if (getCompilerConstructor()) {
        resolve();
        return;
      }

      prior.addEventListener("load", () => resolve(), { once: true });
      prior.addEventListener(
        "error",
        () => reject(new Error("Unable to load the MindAR compiler.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = MINDAR_COMPILER_SRC;
    script.async = true;
    script.dataset.mindarCompiler = MINDAR_COMPILER_SRC;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load the MindAR compiler."));
    document.head.appendChild(script);
  });

  const Compiler = getCompilerConstructor();
  if (!Compiler) {
    throw new Error("MindAR compiler did not initialize in this browser.");
  }

  return Compiler;
}

export async function compileMindTarget(
  file: File,
  onProgress: (progress: number) => void,
) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("Unable to read the target image."));
      element.src = imageUrl;
    });

    const Compiler = await loadMindArCompiler();
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
