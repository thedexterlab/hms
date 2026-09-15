import { z } from 'zod';

export const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .trim()
    .min(1, 'Username or email is required.')
    .max(100, 'Username or email must be 100 characters or less.')
    .refine((value) => value.trim().length > 0, {
      message: 'Username or email is required.',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be 128 characters or less.')
    .refine((value) => value.trim().length > 0, {
      message: 'Password is required.',
    }),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
