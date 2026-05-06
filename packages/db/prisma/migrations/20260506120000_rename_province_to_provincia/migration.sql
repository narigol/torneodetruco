-- Rename province → provincia in User, Tournament and OrganizerContact
ALTER TABLE "User" RENAME COLUMN "province" TO "provincia";
ALTER TABLE "User" RENAME COLUMN "acceptsProvinceInvites" TO "acceptsProvinciaInvites";
ALTER TABLE "Tournament" RENAME COLUMN "province" TO "provincia";
ALTER TABLE "OrganizerContact" RENAME COLUMN "province" TO "provincia";
