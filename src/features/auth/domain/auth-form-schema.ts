import { z } from "zod";

export const authFormSchema = z.object({
  mode: z.enum(["signin", "signup"]),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không đúng định dạng."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

export type AuthFormValues = z.infer<typeof authFormSchema>;
