CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"position" text,
	"photo" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
