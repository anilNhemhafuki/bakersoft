CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"purchase_date" timestamp,
	"purchase_price" numeric(12, 2),
	"current_value" numeric(12, 2),
	"description" text,
	"location" varchar(100),
	"condition" varchar(50) DEFAULT 'good',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"clock_in" timestamp,
	"clock_out" timestamp,
	"break_start" timestamp,
	"break_end" timestamp,
	"total_hours" numeric(4, 2),
	"overtime_hours" numeric(4, 2),
	"status" varchar(20) DEFAULT 'present',
	"notes" text,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"user_name" varchar(200) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar(100),
	"details" jsonb,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now(),
	"status" varchar(20) DEFAULT 'success',
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_code" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"address" text,
	"phone" varchar(20),
	"email" varchar(100),
	"manager_name" varchar(100),
	"is_head_office" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "branches_branch_code_unique" UNIQUE("branch_code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100),
	"phone" varchar(20),
	"address" text,
	"opening_balance" numeric(12, 2) DEFAULT '0',
	"current_balance" numeric(12, 2) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"total_spent" numeric(12, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_inventory_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"branch_id" integer,
	"opening_stock" numeric(10, 2) NOT NULL,
	"purchased_quantity" numeric(10, 2) DEFAULT '0',
	"consumed_quantity" numeric(10, 2) DEFAULT '0',
	"adjustment_quantity" numeric(10, 2) DEFAULT '0',
	"closing_stock" numeric(10, 2) NOT NULL,
	"average_cost" numeric(10, 2) NOT NULL,
	"last_purchase_cost" numeric(10, 2),
	"total_value" numeric(12, 2) NOT NULL,
	"active_batches" integer DEFAULT 0,
	"is_locked" boolean DEFAULT false,
	"captured_at" timestamp DEFAULT now(),
	"captured_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_purchase_return_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"summary_date" date NOT NULL,
	"total_items" integer NOT NULL,
	"total_quantity" numeric(10, 2) NOT NULL,
	"total_loss" numeric(12, 2) NOT NULL,
	"is_day_closed" boolean DEFAULT false,
	"closed_by" varchar,
	"closed_at" timestamp,
	"branch_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_sales_return_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"summary_date" date NOT NULL,
	"total_items" integer NOT NULL,
	"total_quantity" numeric(10, 2) NOT NULL,
	"total_loss" numeric(12, 2) NOT NULL,
	"is_day_closed" boolean DEFAULT false,
	"closed_by" varchar,
	"closed_at" timestamp,
	"branch_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" varchar(100) NOT NULL,
	"date" timestamp NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"vendor" varchar(200),
	"receipt" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_cost_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"branch_id" integer,
	"previous_cost" numeric(10, 2),
	"new_cost" numeric(10, 2) NOT NULL,
	"previous_average_cost" numeric(10, 2),
	"new_average_cost" numeric(10, 2) NOT NULL,
	"change_reason" varchar(100) NOT NULL,
	"reference_id" integer,
	"reference_type" varchar(50),
	"change_date" timestamp DEFAULT now(),
	"changed_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"inv_code" varchar(50),
	"name" varchar(200) NOT NULL,
	"current_stock" numeric(10, 2) NOT NULL,
	"opening_stock" numeric(10, 2) DEFAULT '0',
	"purchased_quantity" numeric(10, 2) DEFAULT '0',
	"consumed_quantity" numeric(10, 2) DEFAULT '0',
	"closing_stock" numeric(10, 2) DEFAULT '0',
	"min_level" numeric(10, 2) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"unit_id" integer,
	"secondary_unit_id" integer,
	"conversion_rate" numeric(15, 6) DEFAULT '1',
	"cost_per_unit" numeric(10, 2) NOT NULL,
	"supplier" varchar(200),
	"category_id" integer,
	"branch_id" integer,
	"is_ingredient" boolean DEFAULT false,
	"notes" text,
	"last_restocked" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "inventory_items_inv_code_unique" UNIQUE("inv_code")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"reason" varchar(200),
	"reference" varchar(100),
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"leave_type" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_days" integer NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"applied_date" timestamp DEFAULT now(),
	"reviewed_by" varchar,
	"reviewed_date" timestamp,
	"review_comments" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_or_party_id" integer NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"reference_number" varchar(100),
	"debit_amount" numeric(12, 2) DEFAULT '0',
	"credit_amount" numeric(12, 2) DEFAULT '0',
	"running_balance" numeric(12, 2) NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"related_order_id" integer,
	"related_purchase_id" integer,
	"payment_method" varchar(50),
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "login_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"email" varchar(255) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"status" varchar(20) NOT NULL,
	"login_time" timestamp DEFAULT now(),
	"location" varchar(200),
	"device_type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50),
	"unit_id" integer,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(200) NOT NULL,
	"customer_id" integer,
	"customer_email" varchar(100),
	"customer_phone" varchar(20),
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"delivery_date" timestamp,
	"branch_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" varchar(50) NOT NULL,
	"contact_person" varchar(100),
	"email" varchar(100),
	"phone" varchar(20),
	"address" text,
	"tax_id" varchar(50),
	"notes" text,
	"opening_balance" numeric(12, 2) DEFAULT '0',
	"current_balance" numeric(12, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"unit_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_date" date NOT NULL,
	"shift" varchar(20) DEFAULT 'Morning',
	"planned_by" varchar(100),
	"approved_by" varchar(100),
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"branch_id" integer,
	"product_id" integer NOT NULL,
	"product_code" varchar(50),
	"batch_no" varchar(50),
	"total_quantity" numeric(10, 2) NOT NULL,
	"unit_type" varchar(50) DEFAULT 'kg',
	"actual_quantity_packets" numeric(10, 2),
	"priority" varchar(20) DEFAULT 'medium',
	"production_start_time" timestamp,
	"production_end_time" timestamp,
	"assigned_to" varchar,
	"notes" text,
	"quantity" numeric(10, 2) NOT NULL,
	"actual_quantity" numeric(10, 2),
	"scheduled_date" date NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_schedule_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_schedule_id" integer,
	"product_id" integer NOT NULL,
	"product_name" varchar(200),
	"product_code" varchar(50),
	"batch_no" varchar(50),
	"total_quantity" numeric(10, 2),
	"unit_type" varchar(50),
	"actual_quantity_packets" numeric(10, 2),
	"priority" varchar(20),
	"production_start_time" timestamp,
	"production_end_time" timestamp,
	"assigned_to" varchar,
	"notes" text,
	"status" varchar(50),
	"schedule_date" date,
	"shift" varchar(20),
	"planned_by" varchar(100),
	"approved_by" varchar(100),
	"closed_at" timestamp DEFAULT now(),
	"closed_by" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_schedule_labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"order_number" varchar(100),
	"customer_name" varchar(200),
	"order_date" timestamp,
	"product_id" integer,
	"product_sku" varchar(50),
	"product_name" varchar(200) NOT NULL,
	"product_description" text,
	"targeted_quantity" numeric(10, 2) NOT NULL,
	"unit" varchar(50),
	"unit_id" integer,
	"actual_quantity" numeric(10, 2),
	"start_datetime" timestamp,
	"end_datetime" timestamp,
	"batch_number" varchar(100),
	"expiry_date" date,
	"weight_volume" varchar(100),
	"packaging_type" varchar(100),
	"status" varchar(50) DEFAULT 'draft',
	"priority" varchar(20) DEFAULT 'normal',
	"assigned_to" varchar(100),
	"shift" varchar(50),
	"quality_check_passed" boolean DEFAULT false,
	"quality_notes" text,
	"is_draft" boolean DEFAULT true,
	"day_closed" boolean DEFAULT false,
	"day_closed_at" timestamp,
	"day_closed_by" varchar(100),
	"remarks" text,
	"notes" text,
	"special_instructions" text,
	"created_by" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_by" varchar(100),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category_id" integer,
	"price" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"margin" numeric(5, 2) NOT NULL,
	"net_weight" numeric(10, 2) DEFAULT '0',
	"sku" varchar(50),
	"unit" varchar(50),
	"unit_id" integer,
	"branch_id" integer,
	"is_global" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"unit_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial_number" integer NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"inventory_item_name" varchar(200) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_id" integer NOT NULL,
	"unit_name" varchar(50) NOT NULL,
	"rate_per_unit" numeric(10, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"return_date" date NOT NULL,
	"purchase_id" integer,
	"party_id" integer,
	"return_reason" varchar(100) DEFAULT 'damaged',
	"is_day_closed" boolean DEFAULT false,
	"branch_id" integer,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_name" varchar(200) NOT NULL,
	"party_id" integer,
	"total_amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"invoice_number" varchar(100),
	"branch_id" integer,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50) NOT NULL,
	"module_id" varchar(100) NOT NULL,
	"granted" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(20) NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salary_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"pay_period_start" timestamp NOT NULL,
	"pay_period_end" timestamp NOT NULL,
	"basic_salary" numeric(12, 2) NOT NULL,
	"overtime_pay" numeric(12, 2) DEFAULT '0',
	"bonus" numeric(12, 2) DEFAULT '0',
	"allowances" numeric(12, 2) DEFAULT '0',
	"deductions" numeric(12, 2) DEFAULT '0',
	"tax" numeric(12, 2) DEFAULT '0',
	"net_pay" numeric(12, 2) NOT NULL,
	"payment_date" timestamp,
	"payment_method" varchar(50) DEFAULT 'bank_transfer',
	"status" varchar(20) DEFAULT 'pending',
	"notes" text,
	"processed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50),
	"unit_id" integer,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(200) NOT NULL,
	"customer_id" integer,
	"customer_email" varchar(100),
	"customer_phone" varchar(20),
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"sale_date" timestamp DEFAULT now(),
	"branch_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial_number" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_id" integer NOT NULL,
	"unit_name" varchar(50) NOT NULL,
	"rate_per_unit" numeric(10, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"return_date" date NOT NULL,
	"sale_id" integer,
	"customer_id" integer,
	"return_reason" varchar(100) DEFAULT 'damaged',
	"is_day_closed" boolean DEFAULT false,
	"branch_id" integer,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"type" varchar(50) DEFAULT 'string' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"address" text,
	"date_of_birth" timestamp,
	"hire_date" timestamp NOT NULL,
	"position" varchar(100) NOT NULL,
	"department" varchar(100) NOT NULL,
	"employment_type" varchar(50) NOT NULL,
	"salary" numeric(12, 2),
	"hourly_rate" numeric(8, 2),
	"bank_account" varchar(100),
	"emergency_contact" varchar(200),
	"emergency_phone" varchar(20),
	"citizenship_number" varchar(50),
	"pan_number" varchar(50),
	"profile_photo" varchar(500),
	"identity_card_url" varchar(500),
	"agreement_paper_url" varchar(500),
	"documents" jsonb,
	"status" varchar(20) DEFAULT 'active',
	"termination_date" timestamp,
	"termination_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_staff_id_unique" UNIQUE("staff_id"),
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "staff_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"shift_start" timestamp NOT NULL,
	"shift_end" timestamp NOT NULL,
	"position" varchar(100),
	"department" varchar(100),
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" varchar(50),
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_batch_consumptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_batch_id" integer NOT NULL,
	"production_schedule_id" integer,
	"inventory_transaction_id" integer,
	"quantity_consumed" numeric(10, 2) NOT NULL,
	"unit_cost_at_consumption" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"consumed_date" timestamp DEFAULT now(),
	"consumed_by" varchar,
	"reason" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_item_id" integer NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"batch_number" varchar(100),
	"quantity_received" numeric(10, 2) NOT NULL,
	"remaining_quantity" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"expiry_date" date,
	"received_date" timestamp DEFAULT now(),
	"supplier_id" integer,
	"branch_id" integer,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "unit_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_unit_id" integer NOT NULL,
	"to_unit_id" integer NOT NULL,
	"conversion_factor" numeric(15, 6) NOT NULL,
	"formula" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"abbreviation" varchar(10) NOT NULL,
	"type" varchar(20) NOT NULL,
	"base_unit" varchar(100),
	"conversion_factor" numeric(15, 6) DEFAULT '1',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "units_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_module_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"module_id" varchar(100) NOT NULL,
	"granted" boolean NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"permission_id" integer NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"password" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"profile_image_url" varchar(500),
	"role" varchar(20) DEFAULT 'staff' NOT NULL,
	"branch_id" integer,
	"can_access_all_branches" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "production_schedule" ADD CONSTRAINT "production_schedule_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_schedule" ADD CONSTRAINT "production_schedule_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;