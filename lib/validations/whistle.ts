import * as z from 'zod';

export const WhistleValidation = z.object({
  whistle: z.string().nonempty().min(3, { message: 'Minimum 3 characters required'}),
  accountId: z.string(),
})

export const CommentValidation = z.object({
  whistle: z.string().nonempty().min(3, { message: 'Minimum 3 characters required'}),
})
