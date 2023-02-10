import fs from "fs";
import { resolve } from "path";
import { client } from "../index";
import { ApplicationCommandData, ApplicationCommandType, BaseComponentData, Collection, Guild, Snowflake } from "discord.js";

export class Loader {
	private static commandsFolder = resolve(__dirname, "../interactions/Commands");
	private static componentsFolder = resolve(__dirname, "../interactions/Components");
	public static async loadCommands({ deleteUnknownCommands = false }): Promise<void> {
		if (!fs.existsSync(this.commandsFolder)) throw new Error("Commands folder not found !");

		const folders = fs.readdirSync(this.commandsFolder);
		const files: string[] = [];

		for (const folder of folders) {
			const subFoldersFiles = fs.readdirSync(resolve(this.commandsFolder, folder));
			for (const file of subFoldersFiles) {
				files.push(resolve(this.commandsFolder, folder, file));
			}
		}
		const guildsCommands = new Map<Snowflake, Array<ApplicationCommandData>>();
		const globalCommands = new Array<ApplicationCommandData>();
		client.localCommands = new Collection<ApplicationCommandType, Collection<string, ApplicationCommandData>>();
		for await (const file of files) {
			import(file).then(({ default: command }: { [key: string]: ApplicationCommandData }) => {
				if (command.type) {
					let tempCollectionResult = client.localCommands.get(command.type) ?? new Collection<string, ApplicationCommandData>();
					tempCollectionResult.set(command.name, command);
					client.localCommands.set(command.type, tempCollectionResult);
					if (command.guilds && command.guilds.length > 0) {
						for (const guild of command.guilds) {
							//on créé le tableau des commandes pour le serveur si il n'existe pas
							if (!guildsCommands.has(guild)) {
								guildsCommands.set(guild, new Array<ApplicationCommandData>());
							}
							//on ajoute la commande au tableau des commandes du serveur
							let arr = guildsCommands.get(guild) ?? [];
							arr?.push(command);
							guildsCommands.set(guild, arr);
						}
					} else {
						//si une commande n'a pas de guilds, on l'ajoute à tous les serveurs
						globalCommands.push(command);
					}
				} else {
					console.error(`${command.name} n'a pas été chargé car aucun type n'est spécifié`);
				}
			});
		}

		for await (const guildId of guildsCommands.keys()) {
			let guild: Guild;
			try {
				guild = await client.guilds.fetch({ force: true, guild: guildId });
			} catch (err) {
				continue;
			}
			if (guild) {
				guild.localCommands = guildsCommands.get(guildId) ?? [];
				let guildCommands = await guild.commands.fetch();
				for await (const command of guildCommands.values()) {
					let registeredCommand = guild.localCommands.find((c) => c.name == command.name);
					//Si la commande est déclarée dans le dossier alors on laisse la nouvelle version
					//Sinon si on autorise les commandes inconnues on la laisse
					//Sinon si on refuse les commandes inconnues on la supprime
					if (!registeredCommand && !deleteUnknownCommands) {
						guild.localCommands.push(command.toJSON() as ApplicationCommandData);
					}
				}
				await guild.commands.set(guild.localCommands);
				console.log(`${guild.localCommands.length} commands loaded for ${guild.name}`);
			}
		}

		let clientCommands = await client.application?.commands.fetch();
		for (const command of clientCommands?.values() ?? []) {
			let c = globalCommands?.find((c) => c.name == command.name);
			if (!c) {
				globalCommands.push(command.toJSON() as ApplicationCommandData);
			}
		}
		await client.application?.commands.set(globalCommands);
	}
	public static async loadComponents(): Promise<void> {
		if (!fs.existsSync(this.componentsFolder)) throw new Error("Components folder not found !");
		const folders = fs.readdirSync(this.componentsFolder);
		const files: string[] = [];

		for (const folder of folders) {
			const subFoldersFiles = fs.readdirSync(resolve(this.componentsFolder, folder));
			for (const file of subFoldersFiles) {
				files.push(resolve(this.componentsFolder, folder, file));
			}
		}
		client.localComponents = new Collection<string, BaseComponentData>();
		for await (const file of files) {
			import(file).then(({ default: command }: { [key: string]: BaseComponentData }) => {
				client.localComponents.set(command.customId, command);
			});
		}
	}
}
