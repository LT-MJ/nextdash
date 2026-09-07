import { z } from "zod";

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().max(20000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  sku: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  barcode: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  brand: z.string().trim().max(200).optional().nullable().or(z.literal("")),
  categoryId: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]).default("DRAFT"),
  visibility: z.enum(["PUBLIC", "HIDDEN"]).default("PUBLIC"),
  featured: z.boolean().default(false),
  price: z.number().min(0, "Price must be zero or more"),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  currency: z.string().trim().length(3).default("USD"),
  weight: z.number().min(0).optional().nullable(),
  weightUnit: z.string().trim().max(10).default("kg"),
  images: z.array(z.string().trim().url().or(z.string().trim().min(1))).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
  initialStock: z.number().int().min(0).optional(),
  reorderThreshold: z.number().int().min(0).optional(),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const variantInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  price: z.number().min(0).optional().nullable(),
  compareAtPrice: z.number().min(0).optional().nullable(),
  barcode: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  image: z.string().trim().max(2000).optional().nullable().or(z.literal("")),
  weight: z.number().min(0).optional().nullable(),
  options: z.record(z.string(), z.string()).default({}),
  position: z.number().int().min(0).default(0),
  initialStock: z.number().int().min(0).optional(),
});
export type VariantInput = z.infer<typeof variantInputSchema>;

export const inventoryAdjustSchema = z.object({
  delta: z.number().int().refine((v) => v !== 0, "Delta must not be zero"),
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional().nullable(),
  parentId: z.string().optional().nullable().or(z.literal("")),
  image: z.string().trim().max(2000).optional().nullable().or(z.literal("")),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const collectionInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional().nullable(),
  image: z.string().trim().max(2000).optional().nullable().or(z.literal("")),
  type: z.enum(["MANUAL", "AUTOMATIC"]).default("MANUAL"),
  rules: z
    .object({
      categoryId: z.string().optional(),
      minPrice: z.number().min(0).optional(),
      maxPrice: z.number().min(0).optional(),
      brand: z.string().optional(),
      featured: z.boolean().optional(),
    })
    .optional()
    .nullable(),
});
export type CollectionInput = z.infer<typeof collectionInputSchema>;

export const couponInputSchema = z.object({
  code: z.string().trim().min(1).max(50),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().min(0),
  minPurchase: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(0).optional().nullable(),
  perCustomerLimit: z.number().int().min(0).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
  productRestrictions: z.array(z.string()).default([]),
  categoryRestrictions: z.array(z.string()).default([]),
});
export type CouponInput = z.infer<typeof couponInputSchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export const orderNotesUpdateSchema = z.object({
  notes: z.string().max(10000).nullable(),
});

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SPAM"]),
});

const addressSchema = z.object({
  name: z.string().trim().min(1).max(200),
  line1: z.string().trim().min(1).max(300),
  line2: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().min(1).max(200),
  region: z.string().trim().max(200).optional().nullable(),
  postalCode: z.string().trim().min(1).max(50),
  country: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(50).optional().nullable(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1).max(999),
      })
    )
    .min(1, "Cart is empty"),
  customerEmail: z.string().trim().email(),
  customerName: z.string().trim().min(1).max(200),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional().nullable(),
  couponCode: z.string().trim().max(50).optional().nullable(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartPriceSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1).max(999),
      })
    )
    .default([]),
});
