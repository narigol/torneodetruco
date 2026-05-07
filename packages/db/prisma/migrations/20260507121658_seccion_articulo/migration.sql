-- CreateEnum
CREATE TYPE "SeccionArticulo" AS ENUM ('GENERAL', 'FLOR', 'TRUCO', 'ENVIDO', 'ANEXO', 'PENALIDADES', 'PUNTAJES', 'JERARQUIA');

-- AlterTable
ALTER TABLE "Articulo" ADD COLUMN     "seccion" "SeccionArticulo" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "Reglamento" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;
