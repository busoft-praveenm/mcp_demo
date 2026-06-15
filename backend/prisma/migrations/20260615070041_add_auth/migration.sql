/*
  Warnings:

  - Added the required column `authorId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `authorId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `password` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
