/*
  Warnings:

  - A unique constraint covering the columns `[documentId]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "conversations_documentId_key" ON "conversations"("documentId");
