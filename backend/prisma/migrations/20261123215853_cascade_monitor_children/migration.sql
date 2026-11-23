ALTER TABLE "checks" DROP CONSTRAINT "checks_monitorId_fkey";

ALTER TABLE "incidents" DROP CONSTRAINT "incidents_monitorId_fkey";

ALTER TABLE "checks" ADD CONSTRAINT "checks_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "incidents" ADD CONSTRAINT "incidents_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
