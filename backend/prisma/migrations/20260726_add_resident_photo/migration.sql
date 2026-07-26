-- AlterTable
ALTER TABLE "occupants" 
ADD COLUMN "photo_url" TEXT,
ADD COLUMN "photo_uploaded_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "occupants_photo_url_idx" ON "occupants"("photo_url") WHERE "photo_url" IS NOT NULL;
