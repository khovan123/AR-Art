import { z } from "zod";

export const studioProductSchema = z.object({
  title: z.string().trim().min(1, "Product title is required.").max(120),
  artistName: z.string().trim().min(1, "Creator name is required.").max(120),
  description: z.string().trim().max(1200),
  status: z.enum(["draft", "published"]),
});

export type StudioProductFormValues = z.infer<typeof studioProductSchema>;
