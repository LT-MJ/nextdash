import { z } from "zod";

/** Server-side authoritative validation for the menu builder (mirrors src/lib/pages/validation.ts). */

export const MENU_ITEM_LINK_TYPES = ["CUSTOM", "HOME", "PAGE", "POST", "CATEGORY"] as const;
export type MenuItemLinkType = (typeof MENU_ITEM_LINK_TYPES)[number];

export const menuInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
});
export type MenuInput = z.infer<typeof menuInputSchema>;

export const menuItemInputSchema = z
  .object({
    parentId: z.string().trim().min(1).optional().nullable(),
    label: z.string().trim().min(1, "Label is required").max(150),
    linkType: z.enum(MENU_ITEM_LINK_TYPES).optional().default("CUSTOM"),
    url: z.string().trim().max(2000).optional().nullable(),
    targetId: z.string().trim().min(1).optional().nullable(),
    openInNewTab: z.boolean().optional().default(false),
  })
  .refine((d) => (d.linkType === "CUSTOM" ? !!d.url : d.linkType === "HOME" ? true : !!d.targetId), {
    message: "A URL or a linked item is required.",
    path: ["url"],
  });
export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export const menuItemReorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), parentId: z.string().nullable(), order: z.number().int() })).max(500),
});
export type MenuItemReorderInput = z.infer<typeof menuItemReorderSchema>;
