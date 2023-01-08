import { Interaction } from "discord.js";
import { AnilistWaifu } from "./AnilistWaifu";

declare module "discord.js" {
	export interface Guild {
		localCommands: Array<ApplicationCommandData>;
		waifu: AnilistWaifu;
		waifuMessage: Message;
	}
}
