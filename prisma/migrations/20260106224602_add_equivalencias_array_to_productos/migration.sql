-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "equivalencias" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "precio" SET DEFAULT 0;
