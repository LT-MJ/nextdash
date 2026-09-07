import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Search,
  Gauge,
  ClipboardCheck,
  Link2,
  ImageIcon,
  ArrowRightLeft,
  FileWarning,
  Map,
  Braces,
  Share2,
  MapPin,
  Send,
  Signpost,
  Bot,
  BarChart3,
  Settings,
  Newspaper,
  FolderTree,
  Tags,
  Users,
  ShoppingBag,
  Package,
  Boxes,
  ClipboardList,
  Percent,
  Star,
  UserCog,
  Activity,
  Image as ImageLucide,
  Cog,
  ListTree,
  Home,
  LayoutTemplate,
} from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: FileText, permission: "pages.view" },
      { label: "Menus", href: "/admin/menus", icon: ListTree, permission: "menus.view" },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Reading", href: "/admin/site/reading", icon: Home, permission: "site.settings" },
      { label: "Header & Footer", href: "/admin/site/header-footer", icon: LayoutTemplate, permission: "site.settings" },
    ],
  },
  {
    label: "SEO",
    items: [
      { label: "Dashboard", href: "/admin/seo", icon: Gauge, permission: "seo.view" },
      { label: "Content", href: "/admin/seo/content", icon: FileText, permission: "seo.view" },
      { label: "Analyzer", href: "/admin/seo/analyzer", icon: Search, permission: "seo.view" },
      { label: "Audit", href: "/admin/seo/audit", icon: ClipboardCheck, permission: "seo.audit" },
      { label: "Links", href: "/admin/seo/links", icon: Link2, permission: "seo.view" },
      { label: "Images", href: "/admin/seo/images", icon: ImageIcon, permission: "seo.view" },
      { label: "Redirects", href: "/admin/seo/redirects", icon: ArrowRightLeft, permission: "seo.redirects" },
      { label: "404 Monitor", href: "/admin/seo/404", icon: FileWarning, permission: "seo.redirects" },
      { label: "Sitemap", href: "/admin/seo/sitemap", icon: Map, permission: "seo.sitemap" },
      { label: "Schema", href: "/admin/seo/schema", icon: Braces, permission: "seo.settings" },
      { label: "Social", href: "/admin/seo/social", icon: Share2, permission: "seo.settings" },
      { label: "Local SEO", href: "/admin/seo/local-seo", icon: MapPin, permission: "seo.settings" },
      { label: "Indexing", href: "/admin/seo/indexing", icon: Send, permission: "seo.indexing" },
      { label: "Breadcrumbs", href: "/admin/seo/breadcrumbs", icon: Signpost, permission: "seo.settings" },
      { label: "Robots.txt", href: "/admin/seo/robots", icon: Bot, permission: "seo.settings" },
      { label: "Analytics", href: "/admin/seo/analytics", icon: BarChart3, permission: "seo.analytics" },
      { label: "Settings", href: "/admin/seo/settings", icon: Settings, permission: "seo.settings" },
    ],
  },
  {
    label: "Blog",
    items: [
      { label: "Dashboard", href: "/admin/blog", icon: Newspaper, permission: "blog.view" },
      { label: "All Posts", href: "/admin/blog/posts", icon: FileText, permission: "blog.view" },
      { label: "Categories", href: "/admin/blog/categories", icon: FolderTree, permission: "blog.view" },
      { label: "Tags", href: "/admin/blog/tags", icon: Tags, permission: "blog.view" },
      { label: "Authors", href: "/admin/blog/authors", icon: Users, permission: "blog.view" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Dashboard", href: "/admin/ecommerce", icon: Gauge, permission: "ecommerce.view" },
      { label: "Products", href: "/admin/ecommerce/products", icon: ShoppingBag, permission: "ecommerce.products" },
      { label: "Categories", href: "/admin/ecommerce/categories", icon: FolderTree, permission: "ecommerce.products" },
      { label: "Collections", href: "/admin/ecommerce/collections", icon: Package, permission: "ecommerce.products" },
      { label: "Inventory", href: "/admin/ecommerce/inventory", icon: Boxes, permission: "ecommerce.inventory" },
      { label: "Orders", href: "/admin/ecommerce/orders", icon: ClipboardList, permission: "ecommerce.orders" },
      { label: "Customers", href: "/admin/ecommerce/customers", icon: Users, permission: "ecommerce.customers" },
      { label: "Coupons", href: "/admin/ecommerce/coupons", icon: Percent, permission: "ecommerce.coupons" },
      { label: "Reviews", href: "/admin/ecommerce/reviews", icon: Star, permission: "ecommerce.reviews" },
      { label: "Analytics", href: "/admin/ecommerce/analytics", icon: BarChart3, permission: "ecommerce.analytics" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Media", href: "/admin/media", icon: ImageLucide, permission: "system.media" },
      { label: "Users & Roles", href: "/admin/users", icon: UserCog, permission: "system.users" },
      { label: "Activity", href: "/admin/activity", icon: Activity, permission: "system.activity" },
      { label: "Jobs", href: "/admin/jobs", icon: Cog, permission: "system.jobs" },
    ],
  },
];
