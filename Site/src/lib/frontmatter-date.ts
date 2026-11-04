import { z } from 'astro/zod';

export const frontmatterDate = z.preprocess(
  (value) => {
    if (value === null) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return value;
  },
  z.coerce.date().optional(),
);
