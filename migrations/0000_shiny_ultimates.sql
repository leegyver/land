CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"inquiry_type" text NOT NULL,
	"property_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text NOT NULL,
	"url" text NOT NULL,
	"image_url" text,
	"category" text NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"price" numeric NOT NULL,
	"address" text NOT NULL,
	"district" text NOT NULL,
	"size" numeric NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"image_url" text NOT NULL,
	"image_urls" text[],
	"featured_image_index" integer,
	"agent_id" integer NOT NULL,
	"featured" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"building_name" text,
	"unit_number" text,
	"supply_area" numeric,
	"private_area" numeric,
	"area_size" text,
	"floor" integer,
	"total_floors" integer,
	"direction" text,
	"elevator" boolean,
	"parking" text,
	"heating_system" text,
	"approval_date" text,
	"land_type" text,
	"zone_type" text,
	"deal_type" text[],
	"deposit" numeric,
	"deposit_amount" numeric,
	"monthly_rent" numeric,
	"maintenance_fee" numeric,
	"owner_name" text,
	"owner_phone" text,
	"tenant_name" text,
	"tenant_phone" text,
	"client_name" text,
	"client_phone" text,
	"special_note" text,
	"co_listing" boolean DEFAULT false,
	"property_description" text,
	"private_note" text,
	"youtube_url" text
);
--> statement-breakpoint
CREATE TABLE "property_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_reply" boolean DEFAULT false NOT NULL,
	"parent_id" integer,
	"is_read_by_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_inquiries" ADD CONSTRAINT "property_inquiries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_inquiries" ADD CONSTRAINT "property_inquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;