/*
  Warnings:

  - You are about to drop the column `injesctionStatus` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `s3BucketFileKey` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `s3BucketFilePath` on the `documents` table. All the data in the column will be lost.
  - Added the required column `s3BucketKey` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `s3BucketLocation` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "injesctionStatus",
DROP COLUMN "s3BucketFileKey",
DROP COLUMN "s3BucketFilePath",
ADD COLUMN     "injestionStatus" "InjestionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "s3BucketKey" TEXT NOT NULL,
ADD COLUMN     "s3BucketLocation" TEXT NOT NULL;
