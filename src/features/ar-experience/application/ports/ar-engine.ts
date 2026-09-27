import type {
  ArExperienceCallbacks,
  ArExperienceConfig,
} from "@/features/ar-experience/domain/ar-experience";

export interface ArEngine {
  start(
    container: HTMLElement,
    config: ArExperienceConfig,
    callbacks: ArExperienceCallbacks,
  ): Promise<void>;
  stop(): Promise<void>;
}
