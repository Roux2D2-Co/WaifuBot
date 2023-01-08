import { ApplicationCommandType, Client, Collection, InteractionType } from "discord.js";

declare module "discord.js" {
	export interface Client {
		localComponents: Collection<string, BaseComponentData>;
		localCommands: Collection<ApplicationCommandType, Collection<string, ApplicationCommandData>>;
	}
}
