import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandSubCommandData,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
} from "discord.js";

import { readdirSync } from "fs";

const localCommands = new Map<string, ChatInputApplicationCommandData>();
const thisFileName = __filename.split("\\").reverse()[0];
(async () => {
	for await (const file of readdirSync(__dirname).filter((file) => file.endsWith(".js"))) {
		if (file === thisFileName) continue;
		console.log(`Chargement de la commande ${__dirname}/${file}`);
		let command = await import(`./${file}`).then((m) => m.default as ChatInputApplicationCommandData);
		console.log(command);
		localCommands.set(command.name, command);
	}
})();

export default {
	dmPermission: false,
	description: "Commandes de développeurs",
	name: "dev",
	guilds: ["780715935593005088"],
	options: [
		{
			name: "execute_as",
			description: "Exécuter une commande en tant qu'un autre utilisateur",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "user",
					description: "L'utilisateur à qui vous voulez faire exécuter la commande",
					type: ApplicationCommandOptionType.User,
					required: true,
				},
				{
					name: "command",
					description: "La commande à exécuter",
					type: ApplicationCommandOptionType.String,
					required: false,
					autocomplete: true,
				},
			],
			execute: async (interaction: ChatInputCommandInteraction) => {},
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: false });
		let subCommand = interaction.options.getSubcommand(true);
		let choosenSubcommand = this.options!.find((option) => option.name === subCommand) as ApplicationCommandSubCommandData;
		!!choosenSubcommand && !!choosenSubcommand.execute && choosenSubcommand.execute(interaction);
	},

	async onAutocomplete(interaction: AutocompleteInteraction) {
		let focusedInteraction = interaction.options.getFocused(true);
		let value = focusedInteraction.value;
		console.log(interaction.guild?.localCommands);
		const commands = interaction.guild?.localCommands;
		if (!commands) return interaction.respond([]);
		else {
			let commandNames = commands
				.map((command) => {
					if (command.name === this.name || !localCommands.has(command.name)) return { name: "", value: "" };
					let localCommand = (localCommands.get(command.name) as ChatInputApplicationCommandData) ?? null;
					const commandName = `/${localCommand.name}`;
					let subCommands: { name: string; value: string }[] = [];
					subCommands.push({ name: commandName, value: command.name });
					for (const option of localCommand?.options ?? []) {
						if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
							let groupName = `${commandName} ${option.name}`;
							for (const subCommand of option.options ?? []) {
								let subCommandName = `${groupName} ${subCommand.name}`;
								subCommands.push({ name: subCommandName, value: subCommandName });
							}
						} else if (option.type === ApplicationCommandOptionType.Subcommand) {
							let subCommandName = `${commandName} ${option.name}`;
							subCommands.push({ name: subCommandName, value: subCommandName });
						}
					}
					return subCommands;
				})
				.flat()
				.filter((command) => !!command.name && (!value || command.name.includes(value)));
			console.log(commandNames);
			await interaction.respond(commandNames);
		}
	},

	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
