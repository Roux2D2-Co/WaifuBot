import { Client } from "discord.js";
import { Loader } from "../loaders/CommandsLoader";
import { InteractionHandler } from "../handlers/InteractionHandler";

export default async (client: Client) => {
	client.user?.setPresence({ activities: [], status: "online" });
	console.log(`Logged in as ${client?.user?.tag} !`);
	await Loader.loadCommands({ deleteUnknownCommands: true }).catch(console.error);
	await Loader.loadComponents().catch(console.error);
	InteractionHandler.start();
};
