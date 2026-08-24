-- AlterTable
ALTER TABLE "SoilAnalysis" ADD COLUMN "culturaAnterior" TEXT;
ALTER TABLE "SoilAnalysis" ADD COLUMN "culturaDesejada" TEXT;
ALTER TABLE "SoilAnalysis" ADD COLUMN "observacoes" TEXT;
ALTER TABLE "SoilAnalysis" ADD COLUMN "produtividade" REAL;
ALTER TABLE "SoilAnalysis" ADD COLUMN "sistemaCultivo" TEXT;

-- CreateTable
CREATE TABLE "PhysicalCharacteristics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soilAnalysisId" TEXT NOT NULL,
    "argila" REAL,
    "silte" REAL,
    "areia" REAL,
    "classeTextural" TEXT,
    "densidade" REAL,
    CONSTRAINT "PhysicalCharacteristics_soilAnalysisId_fkey" FOREIGN KEY ("soilAnalysisId") REFERENCES "SoilAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CropPlanning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soilAnalysisId" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "diasPosPlantio" INTEGER,
    "fertilizerId" TEXT,
    "doseKgHa" REAL,
    CONSTRAINT "CropPlanning_soilAnalysisId_fkey" FOREIGN KEY ("soilAnalysisId") REFERENCES "SoilAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CropPlanning_fertilizerId_fkey" FOREIGN KEY ("fertilizerId") REFERENCES "Fertilizer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalCharacteristics_soilAnalysisId_key" ON "PhysicalCharacteristics"("soilAnalysisId");

