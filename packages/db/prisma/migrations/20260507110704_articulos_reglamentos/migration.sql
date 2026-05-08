/*
  Warnings:

  - You are about to drop the column `contenido` on the `Reglamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reglamento" DROP COLUMN "contenido";

-- CreateTable
CREATE TABLE "Articulo" (
    "id" TEXT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "contenido" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Articulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglamentoArticulo" (
    "id" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "contenidoOverride" TEXT,
    "reglamentoId" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,

    CONSTRAINT "ReglamentoArticulo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReglamentoArticulo_reglamentoId_articuloId_key" ON "ReglamentoArticulo"("reglamentoId", "articuloId");

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglamentoArticulo" ADD CONSTRAINT "ReglamentoArticulo_reglamentoId_fkey" FOREIGN KEY ("reglamentoId") REFERENCES "Reglamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglamentoArticulo" ADD CONSTRAINT "ReglamentoArticulo_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
