import type { ArEngine } from "@/features/ar-experience/application/ports/ar-engine";
import type {
  ArExperienceCallbacks,
  ArExperienceConfig,
} from "@/features/ar-experience/domain/ar-experience";

export class ArSession {
  constructor(private readonly engine: ArEngine) {}

  start(
    container: HTMLElement,
    config: ArExperienceConfig,
    callbacks: ArExperienceCallbacks,
  ) {
    return this.engine.start(container, config, callbacks);
  }

  stop() {
    return this.engine.stop();
  }
}
