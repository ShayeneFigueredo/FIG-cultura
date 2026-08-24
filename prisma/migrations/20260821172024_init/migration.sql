-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "totalArea" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" REAL NOT NULL,
    "crop" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Field_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoilAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fieldId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "depth" TEXT NOT NULL,
    "laboratory" TEXT,
    "methodology" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SoilAnalysis_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoilParameter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soilAnalysisId" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    CONSTRAINT "SoilParameter_soilAnalysisId_fkey" FOREIGN KEY ("soilAnalysisId") REFERENCES "SoilAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendationMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "year" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "RecommendationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodId" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "rangeMin" REAL NOT NULL,
    "rangeMax" REAL NOT NULL,
    "classLevel" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    CONSTRAINT "RecommendationRule_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "RecommendationMethod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutrientRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soilAnalysisId" TEXT NOT NULL,
    "nutrient" TEXT NOT NULL,
    "recommendedDose" REAL NOT NULL,
    CONSTRAINT "NutrientRecommendation_soilAnalysisId_fkey" FOREIGN KEY ("soilAnalysisId") REFERENCES "SoilAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fertilizer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "composition" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "FertilizationStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soilAnalysisId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalCost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FertilizationStrategy_soilAnalysisId_fkey" FOREIGN KEY ("soilAnalysisId") REFERENCES "SoilAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrategyItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strategyId" TEXT NOT NULL,
    "fertilizerId" TEXT NOT NULL,
    "doseKgHa" REAL NOT NULL,
    "pricePerTon" REAL,
    CONSTRAINT "StrategyItem_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "FertilizationStrategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StrategyItem_fertilizerId_fkey" FOREIGN KEY ("fertilizerId") REFERENCES "Fertilizer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
