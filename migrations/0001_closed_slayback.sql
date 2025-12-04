CREATE TABLE "printed_labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"mfd_date" date NOT NULL,
	"exp_date" date NOT NULL,
	"no_of_copies" integer NOT NULL,
	"printed_date" timestamp DEFAULT now(),
	"printed_by" varchar(100),
	"created_at" timestamp DEFAULT now()
);
