CREATE TABLE `brand_aliases` (
	`brand_id` varchar(36) NOT NULL,
	`alias` varchar(160) NOT NULL,
	CONSTRAINT `brand_aliases_brand_id_alias_pk` PRIMARY KEY(`brand_id`,`alias`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`website` varchar(500),
	`description` text,
	`locale` varchar(20) NOT NULL DEFAULT 'zh-CN',
	`archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `brands_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` varchar(36) NOT NULL,
	`brand_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`website` varchar(500),
	`aliases` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `competitor_brand_name_unique` UNIQUE(`brand_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `detection_runs` (
	`id` varchar(36) NOT NULL,
	`prompt_id` varchar(36) NOT NULL,
	`provider` varchar(80) NOT NULL,
	`model` varchar(160) NOT NULL,
	`status` enum('queued','running','succeeded','failed','cancelled') NOT NULL,
	`is_mock` boolean NOT NULL DEFAULT false,
	`raw_response` text,
	`analysis` json,
	`error_code` varchar(120),
	`error_message` text,
	`latency_ms` int,
	`requested_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `detection_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_groups` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` varchar(36) NOT NULL,
	`group_id` varchar(36),
	`question` text NOT NULL,
	`locale` varchar(20) NOT NULL DEFAULT 'zh-CN',
	`intent` enum('informational','commercial','transactional','navigational') NOT NULL,
	`priority` int NOT NULL DEFAULT 50,
	`tags` json NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `brand_aliases` ADD CONSTRAINT `brand_aliases_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competitors` ADD CONSTRAINT `competitors_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `detection_runs` ADD CONSTRAINT `detection_runs_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prompts` ADD CONSTRAINT `prompts_group_id_prompt_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `prompt_groups`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `detection_prompt_time_idx` ON `detection_runs` (`prompt_id`,`requested_at`);--> statement-breakpoint
CREATE INDEX `prompts_group_active_idx` ON `prompts` (`group_id`,`active`);