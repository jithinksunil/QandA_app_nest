-- CreateEnum
CREATE TYPE "InjestionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "injesctionStatus" "InjestionStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "contentEmbedding" DROP NOT NULL;
