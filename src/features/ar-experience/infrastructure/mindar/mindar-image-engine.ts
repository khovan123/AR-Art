import * as THREE from "three";

import type { ArEngine } from "@/features/ar-experience/application/ports/ar-engine";
import type {
  ArExperienceCallbacks,
  ArExperienceConfig,
} from "@/features/ar-experience/domain/ar-experience";
import { ThreeArOverlayScene } from "@/features/ar-experience/infrastructure/three/three-ar-overlay-scene";

type MindArAnchor = {
  group: THREE.Group;
  onTargetFound?: () => void;
  onTargetLost?: () => void;
};

type MindArRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  video?: HTMLVideoElement;
  cssRenderer?: { domElement: HTMLElement };
  addAnchor(index: number): MindArAnchor;
  start(): Promise<void>;
  stop(): Promise<void> | void;
  resize(): void;
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
    throw new Error("AR engine is still loading. Wait a moment and try again.");
  }

  return mindArModule;
}

export class MindArImageEngine implements ArEngine {
  private runtime: MindArRuntime | null = null;
  private overlayScene: ThreeArOverlayScene | null = null;
  private started = false;
  private targetVisible = false;
  private cleanupViewportSync: (() => void) | null = null;

  async start(
    container: HTMLElement,
    config: ArExperienceConfig,
    callbacks: ArExperienceCallbacks,
  ) {
    if (this.runtime) await this.stop();

    try {
      const mindArModule = getPreloadedMindArRuntime();
      const runtime = new mindArModule.MindARThree({
        container,
        imageTargetSrc: config.targetUrl,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
      });

      this.runtime = runtime;
      const { renderer, scene, camera } = runtime;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const anchor = runtime.addAnchor(config.targetIndex);
      anchor.onTargetFound = () => {
        this.targetVisible = true;
        this.overlayScene?.setTargetVisible(true);
        callbacks.onTargetFound();
      };
      anchor.onTargetLost = () => {
        this.targetVisible = false;
        this.overlayScene?.setTargetVisible(false);
        callbacks.onTargetLost();
      };

      // Camera/tracking starts before artwork assets are loaded. This preserves
      // the iOS Safari user-gesture permission path even for larger GLB assets.
      await runtime.start();

      const cameraVideo =
        runtime.video ?? container.querySelector<HTMLVideoElement>("video");
      if (!cameraVideo || !(cameraVideo.srcObject instanceof MediaStream)) {
        throw new Error("Camera started but the live preview stream is unavailable.");
      }

      cameraVideo.muted = true;
      cameraVideo.defaultMuted = true;
      cameraVideo.playsInline = true;
      cameraVideo.autoplay = true;
      cameraVideo.setAttribute("muted", "");
      cameraVideo.setAttribute("playsinline", "");
      cameraVideo.setAttribute("webkit-playsinline", "");
      cameraVideo.setAttribute("autoplay", "");
      Object.assign(cameraVideo.style, {
        zIndex: "0",
        display: "block",
        visibility: "visible",
        opacity: "1",
        background: "#000",
      });

      const canvas = renderer.domElement;
      Object.assign(canvas.style, {
        zIndex: "1",
        pointerEvents: "none",
        background: "transparent",
      });

      if (runtime.cssRenderer?.domElement) {
        Object.assign(runtime.cssRenderer.domElement.style, {
          zIndex: "2",
          pointerEvents: "none",
        });
      }

      this.bindViewportSync(runtime, container);

      try {
        await cameraVideo.play();
      } catch {
        // Safari can reject a redundant play() while the camera is already live.
      }

      this.started = true;
      callbacks.onScanning();

      const overlayScene = new ThreeArOverlayScene();
      this.overlayScene = overlayScene;
      overlayScene.setTargetVisible(this.targetVisible);
      const overlay = await overlayScene.create(config.overlay);
      if (this.runtime !== runtime || this.overlayScene !== overlayScene) {
        overlayScene.dispose();
        return;
      }
      anchor.group.add(overlay);

      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        overlayScene.update(clock.getElapsedTime());
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

  private bindViewportSync(runtime: MindArRuntime, container: HTMLElement) {
    this.cleanupViewportSync?.();

    let frameId: number | null = null;
    let settleTimer: number | null = null;

    const resize = () => {
      if (this.runtime !== runtime || !container.isConnected) return;
      if (container.clientWidth <= 0 || container.clientHeight <= 0) return;
      runtime.resize();
    };

    const scheduleResize = () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        resize();
        window.requestAnimationFrame(resize);
      });

      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(resize, 250);
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", scheduleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", scheduleResize, { passive: true });

    this.cleanupViewportSync = () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("scroll", scheduleResize);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      this.cleanupViewportSync = null;
    };

    scheduleResize();
  }

  async stop() {
    this.cleanupViewportSync?.();
    this.overlayScene?.dispose();
    this.overlayScene = null;
    this.targetVisible = false;

    if (!this.runtime) return;
    const runtime = this.runtime;
    this.runtime = null;
    runtime.renderer.setAnimationLoop(null);

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
