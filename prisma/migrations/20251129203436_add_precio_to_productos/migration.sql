-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabricantes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "fabricantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "imagen" TEXT,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_vehiculos" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "vehiculo_id" INTEGER NOT NULL,

    CONSTRAINT "producto_vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(255),
    "nombre" VARCHAR(255) NOT NULL,
    "imagen" TEXT,
    "hay_stock" BOOLEAN DEFAULT true,
    "marca" INTEGER,
    "categoria" INTEGER,
    "fabricante" INTEGER,
    "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "desde" INTEGER,
    "hasta" INTEGER,
    "fabricante_id" INTEGER,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_prodveh_producto" ON "producto_vehiculos"("producto_id");

-- CreateIndex
CREATE INDEX "idx_prodveh_vehiculo" ON "producto_vehiculos"("vehiculo_id");

-- CreateIndex
CREATE UNIQUE INDEX "producto_vehiculos_producto_id_vehiculo_id_key" ON "producto_vehiculos"("producto_id", "vehiculo_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE INDEX "idx_productos_categoria" ON "productos"("categoria");

-- CreateIndex
CREATE INDEX "idx_productos_fabricante" ON "productos"("fabricante");

-- CreateIndex
CREATE INDEX "idx_productos_marca" ON "productos"("marca");

-- CreateIndex
CREATE INDEX "idx_vehiculos_fabricante" ON "vehiculos"("fabricante_id");

-- AddForeignKey
ALTER TABLE "producto_vehiculos" ADD CONSTRAINT "producto_vehiculos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto_vehiculos" ADD CONSTRAINT "producto_vehiculos_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_fkey" FOREIGN KEY ("categoria") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_fabricante_fkey" FOREIGN KEY ("fabricante") REFERENCES "fabricantes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marca_fkey" FOREIGN KEY ("marca") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_fabricante_id_fkey" FOREIGN KEY ("fabricante_id") REFERENCES "fabricantes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
