import { arConfig } from "@/config/ar";
import { ArViewer } from "@/features/ar-experience/presentation/components/ar-viewer";

export default function ArPage() {
  return (
    <ArViewer
      config={{
        targetUrl: arConfig.targetUrl,
        targetIndex: arConfig.targetIndex,
        overlay: arConfig.overlay,
      }}
    />
  );
}
