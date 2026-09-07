-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "blocks" TEXT,
ADD COLUMN     "contentFormat" TEXT NOT NULL DEFAULT 'html';

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "linkType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "url" TEXT,
    "targetId" TEXT,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeaderFooterSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "logoImageUrl" TEXT,
    "logoAltText" TEXT,
    "logoText" TEXT,
    "headerLayout" TEXT NOT NULL DEFAULT 'logo-left-nav-right',
    "headerSticky" BOOLEAN NOT NULL DEFAULT false,
    "primaryMenuId" TEXT,
    "footerColumns" TEXT,
    "socialLinks" TEXT,
    "copyrightText" TEXT NOT NULL DEFAULT '© {year} {siteName}. All rights reserved.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeaderFooterSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "homepageMode" TEXT NOT NULL DEFAULT 'DEFAULT',
    "homepagePageId" TEXT,
    "blogPageId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuItem_menuId_idx" ON "MenuItem"("menuId");

-- CreateIndex
CREATE INDEX "MenuItem_parentId_idx" ON "MenuItem"("parentId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeaderFooterSettings" ADD CONSTRAINT "HeaderFooterSettings_primaryMenuId_fkey" FOREIGN KEY ("primaryMenuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSettings" ADD CONSTRAINT "ReadingSettings_homepagePageId_fkey" FOREIGN KEY ("homepagePageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSettings" ADD CONSTRAINT "ReadingSettings_blogPageId_fkey" FOREIGN KEY ("blogPageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

