import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandSubCommandData,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
} from "discord.js";
import config from "../../../config.json";
import { CommandNames, OptionAndValue, getCommandOptions, getNewInteraction, localCommands } from "../../../utils/discordMock";

const getFullCommandPath = /(?<command>\w+?(?= |$))(?: ?(?<subCommandGroup>\w+?(?= |$|\W))?(?=.+$) ?(?<subCommand>\w+))?/gm;

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
					required: true,
					autocomplete: true,
				},
			],
			execute: async (interaction: ChatInputCommandInteraction) => {
				if (!config.DISCORD_BOT_DEVS.includes(interaction.user.id))
					return interaction.reply({ content: "You can't use this command", ephemeral: false });
				let commandPath = interaction.options.getString("command", true);
				let commandNames = (getFullCommandPath.exec(commandPath)?.groups as CommandNames) ?? {
					groups: { command: "", subCommandGroup: "", subCommand: "" },
				};
				let optionsMap;
				try {
					optionsMap = await getCommandOptions(interaction, commandNames);
				} catch (e) {
					let err = e as Error;
					return interaction.editReply({ content: err.message });
				}
				const options: OptionAndValue[] = [];
				for (const [, value] of optionsMap) {
					options.push(value);
				}

				// const interactionJson = interaction.toJSON() as { [key: string]: any };
				// interactionJson.options = interaction.options.data;
				const newInteraction = (await getNewInteraction(interaction, commandNames, options)) as ChatInputCommandInteraction;
				newInteraction.reply = newInteraction.editReply as any;
				newInteraction.deferReply = () => newInteraction.fetchReply() as any;
				newInteraction.deleteReply = () =>
					newInteraction.editReply({ content: "This message would be deleted if wasn't executed by *Execute as*" }) as any;
				try {
					let localCommand = localCommands.get(commandNames.command);
					localCommand?.execute(newInteraction);
				} catch (e) {
					console.error(e);
					interaction.editReply("Une erreur est survenue");
				}
			},
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: true });
		let subCommand = interaction.options.getSubcommand(true);
		let choosenSubcommand = this.options!.find((option: { name: any }) => option.name === subCommand) as ApplicationCommandSubCommandData;
		!!choosenSubcommand && !!choosenSubcommand.execute && choosenSubcommand.execute(interaction);
	},

	async onAutocomplete(interaction: AutocompleteInteraction) {
		let focusedInteraction = interaction.options.getFocused(true);
		let value = focusedInteraction.value;
		const commands = interaction.guild?.localCommands;
		if (!commands) return interaction.respond([]);
		else {
			let commandNames = Array.from(localCommands.values())
				.flatMap((localCommand) => {
					const commandName = `/${localCommand.name}`;
					let possibilites: { name: string; value: string }[] = [];

					for (const option of localCommand.options ?? []) {
						switch (option.type) {
							case ApplicationCommandOptionType.SubcommandGroup: {
								//example : /profile edit quote
								possibilites.push(
									...option.options
										.filter((subOption) => subOption.type === ApplicationCommandOptionType.Subcommand)
										.map((subcommand) => {
											return {
												name: `${commandName} ${option.name} ${subcommand.name}`,
												value: `${localCommand.name} ${option.name} ${subcommand.name}`,
											};
										})
								);
								break;
							}
							case ApplicationCommandOptionType.Subcommand: {
								//example : /profile view
								possibilites.push({
									name: `${commandName} ${option.name}`,
									value: `${localCommand.name} ${option.name}`,
								});
							}
						}
					}

					//si il y a des sous groupes et/ou des sous commandes, on ne met pas la commande principale car elle devient innaccessible
					possibilites[0] ||= { name: commandName, value: localCommand.name };

					return possibilites;
				})
				.filter((command: { name: string | any[] }) => !!command.name && (!value || command.name.includes(value)));
			await interaction.respond(commandNames);
		}
	},

	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
