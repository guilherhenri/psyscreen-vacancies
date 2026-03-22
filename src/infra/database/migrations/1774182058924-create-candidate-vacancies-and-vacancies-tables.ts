import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateCandidateVacanciesAndVacanciesTables1774182058924 implements MigrationInterface {
  name = 'CreateCandidateVacanciesAndVacanciesTables1774182058924'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vacancies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "status" character varying NOT NULL, "criteria_version" integer NOT NULL, "criteria" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_3b45154a366568190cc15be2906" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "candidate_vacancies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "candidate_id" uuid NOT NULL, "vacancy_id" uuid NOT NULL, "status" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a74330d2dc27005c5a29dc8d361" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8669ad8f0247dba03879056dd9" ON "candidate_vacancies" ("candidate_id", "vacancy_id") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8669ad8f0247dba03879056dd9"`
    )
    await queryRunner.query(`DROP TABLE "candidate_vacancies"`)
    await queryRunner.query(`DROP TABLE "vacancies"`)
  }
}
