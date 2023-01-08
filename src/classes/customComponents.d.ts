import { client } from "src/index";

declare module "discord.js" {
	export interface BaseApplicationCommandData {
		execute: (interaction: Interaction, ...args: any[]) => Promise<void>;
		guilds?: Array<Snowflake>;
	}

	export interface ApplicationCommandSubCommandData {
		execute?: (interaction: Interaction, ...args: any[]) => Promise<void>;
	}

	export interface ChatInputApplicationCommandData {
		async onAutocomplete?: (interaction: Interaction) => Promise<void>;
	}

	export interface ModalComponentData extends BaseComponentData {}
	export interface BaseComponentData {
		regexValidator?: RegExp;
		execute: (interaction: Interaction, ...args: any[]) => Promise<void>;
		customId: string;
	}
}