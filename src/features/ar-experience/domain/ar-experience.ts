export type ArExperienceStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "found"
  | "error";

export type ArOverlay =
  | { kind: "video"; url: string; aspectRatio: number }
  | { kind: "procedural" };

export interface ArExperienceConfig {
  targetUrl: string;
  targetIndex: number;
  overlay: ArOverlay;
}

export interface ArExperienceCallbacks {
  onScanning(): void;
  onTargetFound(): void;
  onTargetLost(): void;
  onError(error: Error): void;
}
