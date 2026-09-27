declare module "mind-ar/src/image-target/compiler.js" {
  export class Compiler {
    compileImageTargets(
      images: HTMLImageElement[],
      onProgress?: (progress: number) => void,
    ): Promise<unknown[]>;
    exportData(): Promise<ArrayBuffer>;
  }
}
