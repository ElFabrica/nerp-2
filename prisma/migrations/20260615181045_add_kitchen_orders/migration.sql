-- CreateEnum
CREATE TYPE "KitchenOrderStatus" AS ENUM ('EM_PREPARO', 'PRONTO', 'ENTREGUE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "prepTimeMinutes" INTEGER;

-- CreateTable
CREATE TABLE "kitchen_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "dishName" TEXT NOT NULL,
    "productId" TEXT,
    "estimatedMinutes" INTEGER,
    "status" "KitchenOrderStatus" NOT NULL DEFAULT 'EM_PREPARO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "kitchen_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kitchen_orders_organizationId_status_idx" ON "kitchen_orders"("organizationId", "status");

-- CreateIndex
CREATE INDEX "kitchen_orders_createdAt_idx" ON "kitchen_orders"("createdAt");

-- AddForeignKey
ALTER TABLE "kitchen_orders" ADD CONSTRAINT "kitchen_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_orders" ADD CONSTRAINT "kitchen_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_orders" ADD CONSTRAINT "kitchen_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
