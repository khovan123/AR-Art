import * as THREE from "three";

import type { ArEngine } from "@/features/ar-experience/application/ports/ar-engine";
import type {
  ArExperienceCallbacks,
  ArExperienceConfig,
  ArOverlay,
} from "@/features/ar-experience/domain/ar-experience";

type MindArAnchor = {
  group: THREE.Group;
  onTargetFound?: () => void;
  onTargetLost?: () => void;
};

type MindArRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  addAnchor(index: number): MindArAnchor;
  start(): Promise<void>;
  stop(): Promise<void> | void;
};

type MindArConstructor = new (options: {
  container: HTMLElement;
  imageTargetSrc: string;
  uiLoading?: "yes" | "no";
  uiScanning?: "yes" | "no";
  uiError?: "yes" | "no";
  filterMinCF?: number;
  filterBeta?: number;
  warmupTolerance?: number;
  missTolerance?: number;
}) => MindArRuntime;

type MindArModule = { MindARThree: MindArConstructor };

let mindArModule: MindArModule | null = null;
let mindArModulePromise: Promise<MindArModule> | null = null;

function loadMindArRuntime() {
  if (mindArModule) return Promise.resolve(mindArModule);

  if (!mindArModulePromise) {
    mindArModulePromise = (
      import("mind-ar/dist/mindar-image-three.prod.js") as unknown as Promise<MindArModule>
    )
      .then((module) => {
        mindArModule = module;
        return module;
      })
      .catch((cause) => {
        mindArModulePromise = null;
        throw cause;
      });
  }

  return mindArModulePromise;
}

export function preloadMindArRuntime() {
  return loadMindArRuntime().then(() => undefined);
}

function getPreloadedMindArRuntime() {
  if (!mindArModule) {
    throw new Error("AR engine is still loading. Wait a moment and tap Start camera again.");
  }

  return mindArModule;
}

export class MindArImageEngine implements ArEngine {
  private runtime: MindArRuntime | null = null;
  private animatedObject: THREE.Object3D | null = null;
  private video: HTMLVideoElement | null = null;
  private videoTexture: THREE.VideoTexture | null = null;
  private started = false;

  async start(
    container: HTMLElement,
    config: ArExperienceConfig,
    callbacks: ArExperienceCallbacks,
  ) {
    if (this.runtime) await this.stop();

    try {
      // This lookup is synchronous. The module is preloaded before the button
      // becomes active so iPhone Safari reaches MindAR's getUserMedia() from
      // the same user interaction without an import await in between.
      const mindArModule = getPreloadedMindArRuntime();

      const runtime = new mindArModule.MindARThree({
        container,
        imageTargetSrc: config.targetUrl,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
        filterMinCF: 0.0005,
        filterBeta: 0.001,
        warmupTolerance: 5,
        missTolerance: 5,
      });

      this.runtime = runtime;
      const { renderer, scene, camera } = runtime;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const anchor = runtime.addAnchor(config.targetIndex);
      const overlay = this.createOverlay(config.overlay);
      anchor.group.add(overlay);

      anchor.onTargetFound = () => {
        if (this.video) void this.video.play().catch(() => undefined);
        callbacks.onTargetFound();
      };
      anchor.onTargetLost = () => {
        this.video?.pause();
        callbacks.onTargetLost();
      };

      await runtime.start();
      this.started = true;
      callbacks.onScanning();

      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const elapsed = clock.getElapsedTime();
        if (this.animatedObject) {
          this.animatedObject.rotation.x = elapsed * 0.7;
          this.animatedObject.rotation.y = elapsed * 1.05;
          const pulse = 0.9 + Math.sin(elapsed * 2.5) * 0.08;
          this.animatedObject.scale.setScalar(pulse);
        }
        renderer.render(scene, camera);
      });
    } catch (cause) {
      const error =
        cause instanceof Error ? cause : new Error("Unable to start the AR camera.");
      callbacks.onError(error);
      await this.stop();
      throw error;
    }
  }

  private createOverlay(overlay: ArOverlay) {
    if (overlay.kind === "video") {
      const video = document.createElement("video");
      video.src = overlay.url;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("autoplay", "");
      video.preload = "auto";
      this.video = video;

      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.videoTexture = texture;

      const height = 1 / Math.max(overlay.aspectRatio, 0.1);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, height),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
      );
      plane.position.z = 0.02;
      return plane;
    }

    const group = new THREE.Group();
    const artworkPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.552),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
      }),
    );
    artworkPlane.position.z = 0.01;
    group.add(artworkPlane);

    const halo = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.14, 0.035, 96, 14),
      new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.95 }),
    );
    halo.position.set(0, 0, 0.12);
    group.add(halo);
    this.animatedObject = halo;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.008, 16, 96),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      }),
    );
    ring.position.z = 0.06;
    group.add(ring);
    return group;
  }

  async stop() {
    if (!this.runtime) return;

    const runtime = this.runtime;
    this.runtime = null;
    this.animatedObject = null;

    runtime.renderer.setAnimationLoop(null);
    this.video?.pause();
    if (this.video) this.video.removeAttribute("src");
    this.video?.load();
    this.video = null;
    this.videoTexture?.dispose();
    this.videoTexture = null;

    if (this.started) {
      try {
        await runtime.stop();
      } catch {
        // Some browsers can report a redundant video-stop error during teardown.
      }
    }

    this.started = false;
    const canvas = runtime.renderer.domElement;
    canvas.parentElement?.removeChild(canvas);
    runtime.renderer.dispose();
  }
}
