CREATE TABLE `monitoring_tasks` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`prompt_id` varchar(36) NOT NULL,
	`provider` varchar(80) NOT NULL,
	`model` varchar(160),
	`schedule` varchar(80) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`last_run_at` timestamp,
	`next_run_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `monitoring_tasks` ADD CONSTRAINT `monitoring_tasks_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `monitoring_tasks_active_next_idx` ON `monitoring_tasks` (`active`,`next_run_at`);