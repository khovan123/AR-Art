import { z } from "zod";

export const studioCollectionSchema = z.object({
  name: z.string().trim().min(1, "Collection name is required.").max(80),
  productIds: z.array(z.string().uuid()).max(10),
  status: z.enum(["draft", "published"]),
});

export type StudioCollectionFormValues = z.infer<typeof studioCollectionSchema>;
