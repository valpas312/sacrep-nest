/*
  Warnings:

  - You are about to drop the column `equivalencias` on the `productos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "productos" DROP COLUMN "equivalencias";

-- CreateTable
CREATE TABLE "equivalencia_grupos" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "equivalencia_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equivalencia_codigos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "grupo_id" INTEGER NOT NULL,

    CONSTRAINT "equivalencia_codigos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equivalencia_codigos_grupo_id_idx" ON "equivalencia_codigos"("grupo_id");

-- CreateIndex
CREATE UNIQUE INDEX "equivalencia_codigos_codigo_key" ON "equivalencia_codigos"("codigo");

-- AddForeignKey
ALTER TABLE "equivalencia_codigos" ADD CONSTRAINT "equivalencia_codigos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "equivalencia_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
