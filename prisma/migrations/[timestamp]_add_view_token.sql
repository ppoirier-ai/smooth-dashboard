-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- First add the column as nullable
ALTER TABLE "BinanceAccount" ADD COLUMN "viewToken" TEXT;

-- Update existing records with a random UUID
UPDATE "BinanceAccount" 
SET "viewToken" = gen_random_uuid()::text
WHERE "viewToken" IS NULL;

-- Make the column required and unique
ALTER TABLE "BinanceAccount" 
ALTER COLUMN "viewToken" SET NOT NULL,
ADD CONSTRAINT "BinanceAccount_viewToken_key" UNIQUE ("viewToken"); 