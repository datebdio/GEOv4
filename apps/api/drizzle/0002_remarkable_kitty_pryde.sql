CREATE TABLE `content_items` (
	`id` varchar(36) NOT NULL,
	`brand_id` varchar(36) NOT NULL,
	`prompt_id` varchar(36),
	`title` varchar(300) NOT NULL,
	`status` enum('draft','review','approved','archived') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_versions` (
	`id` varchar(36) NOT NULL,
	`content_id` varchar(36) NOT NULL,
	`version` int NOT NULL,
	`body_markdown` text NOT NULL,
	`evidence_urls` json NOT NULL,
	`change_note` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_versions_content_version_unique` UNIQUE(`content_id`,`version`)
);
--> statement-breakpoint
CREATE TABLE `effect_snapshots` (
	`id` varchar(36) NOT NULL,
	`publication_id` varchar(36) NOT NULL,
	`baseline_run_id` varchar(36) NOT NULL,
	`followup_run_id` varchar(36) NOT NULL,
	`mention_delta` int NOT NULL,
	`rank_delta` int,
	`citation_delta` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `effect_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `effect_publication_runs_unique` UNIQUE(`publication_id`,`baseline_run_id`,`followup_run_id`)
);
--> statement-breakpoint
CREATE TABLE `publication_records` (
	`id` varchar(36) NOT NULL,
	`content_id` varchar(36) NOT NULL,
	`version_id` varchar(36) NOT NULL,
	`platform` enum('zhihu','baijiahao','toutiao','sohu') NOT NULL,
	`account` varchar(160) NOT NULL,
	`status` enum('prepared','drafted','published','failed') NOT NULL DEFAULT 'prepared',
	`idempotency_key` varchar(200) NOT NULL,
	`canonical_url` varchar(1000),
	`notes` text,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publication_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `publication_idempotency_unique` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_versions` ADD CONSTRAINT `content_versions_content_id_content_items_id_fk` FOREIGN KEY (`content_id`) REFERENCES `content_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `effect_snapshots` ADD CONSTRAINT `effect_snapshots_publication_id_publication_records_id_fk` FOREIGN KEY (`publication_id`) REFERENCES `publication_records`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `effect_snapshots` ADD CONSTRAINT `effect_snapshots_baseline_run_id_detection_runs_id_fk` FOREIGN KEY (`baseline_run_id`) REFERENCES `detection_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `effect_snapshots` ADD CONSTRAINT `effect_snapshots_followup_run_id_detection_runs_id_fk` FOREIGN KEY (`followup_run_id`) REFERENCES `detection_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publication_records` ADD CONSTRAINT `publication_records_content_id_content_items_id_fk` FOREIGN KEY (`content_id`) REFERENCES `content_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publication_records` ADD CONSTRAINT `publication_records_version_id_content_versions_id_fk` FOREIGN KEY (`version_id`) REFERENCES `content_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_items_brand_status_idx` ON `content_items` (`brand_id`,`status`);