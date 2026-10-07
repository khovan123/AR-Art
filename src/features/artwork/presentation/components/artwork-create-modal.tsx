"use client";

import { Modal } from "@/components/molecules/modal";
import { ArtworkCreateForm } from "@/features/artwork/presentation/components/artwork-create-form";

export function ArtworkCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (productId: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add product"
      maxWidthClassName="max-w-[92rem]"
    >
      <div data-motion-skip>
        <ArtworkCreateForm embedded onCreated={onCreated} onDone={onClose} />
      </div>
    </Modal>
  );
}
