import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandSubGroupData,
	ApplicationCommandSubCommandData,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ApplicationCommandOptionData,
	MessageComponentInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	UserSelectMenuBuilder,
	RoleSelectMenuBuilder,
	MentionableSelectMenuBuilder,
	ChannelSelectMenuBuilder,
	Message,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ModalSubmitInteraction,
	bold,
} from "discord.js";

import { readdirSync } from "fs";
import { client } from "src";

const localCommands = new Map<string, ChatInputApplicationCommandData>();
const thisFileName = __filename.split("\\").reverse()[0];
const getFullCommandPath = /(?<command>\w+?(?= |$))(?: ?(?<subCommandGroup>\w+?(?= |$|\W))?(?=.+$) ?(?<subCommand>\w+))?/gm;
type getFullCommandPathGroupsResult = { command: string; subCommandGroup?: string; subCommand?: string };

(async () => {
	for await (const file of readdirSync(__dirname).filter((file) => file.endsWith(".js"))) {
		if (file === thisFileName) continue;
		console.log(`Chargement de la commande ${__dirname}/${file}`);
		let command = await import(`./${file}`).then((m) => m.default as ChatInputApplicationCommandData);
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
					required: true,
					autocomplete: true,
				},
			],
			execute: async (interaction: ChatInputCommandInteraction) => {
				let user = interaction.options.getUser("user", true);
				let commandPath = interaction.options.getString("command", true);
				let { command, subCommandGroup, subCommand } = (getFullCommandPath.exec(commandPath)?.groups as getFullCommandPathGroupsResult) ?? {
					groups: { command: "", subCommandGroup: "", subCommand: "" },
				};
				if (!localCommands.has(command)) return interaction.editReply("Cette commande n'existe pas");
				let localCommand = localCommands.get(command) as ChatInputApplicationCommandData;
				let subCommandGroupData: ApplicationCommandSubGroupData | undefined;
				let subCommandData: ApplicationCommandSubCommandData | undefined;
				let executableCommand:
					| ChatInputApplicationCommandData
					| ApplicationCommandSubCommandData
					| ApplicationCommandSubGroupData
					| undefined;
				if (subCommandGroup) {
					subCommandGroupData = localCommand.options?.find((option) => option.name === subCommandGroup) as ApplicationCommandSubGroupData;
					if (!subCommandGroupData) return interaction.editReply("Cette commande n'existe pas");
				}
				subCommandData = (subCommandGroupData || localCommand).options?.find(
					(option) => option.name === subCommand
				) as ApplicationCommandSubCommandData;
				if (!!subCommandData && subCommandData.execute) {
					executableCommand = subCommandData;
				} else {
					executableCommand = localCommand;
				}

				const optionsMap = await collectVariables(interaction, executableCommand.options);
				console.log(optionsMap);
				const options: { [key: string]: any } = {};
				for (const [key, value] of optionsMap) {
					options[key] = value;
				}

				const interactionJson = interaction.toJSON();
				console.log(interactionJson);

				await interaction.editReply({ content: "Récupération des options terminées\n\n" + JSON.stringify(options, null, 2) });
				await interaction.followUp({ content: "test follow up visible depuis une interaction ephermal", ephemeral: false });
			},
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: true });
		let subCommand = interaction.options.getSubcommand(true);
		let choosenSubcommand = this.options!.find((option) => option.name === subCommand) as ApplicationCommandSubCommandData;
		!!choosenSubcommand && !!choosenSubcommand.execute && choosenSubcommand.execute(interaction);
	},

	async onAutocomplete(interaction: AutocompleteInteraction) {
		let focusedInteraction = interaction.options.getFocused(true);
		let value = focusedInteraction.value;
		const commands = interaction.guild?.localCommands;
		if (!commands) return interaction.respond([]);
		else {
			let commandNames = commands
				.map((command) => {
					if (command.name === this.name || !localCommands.has(command.name)) return { name: "", value: "" };
					let localCommand = (localCommands.get(command.name) as ChatInputApplicationCommandData) ?? null;
					const commandName = `/${localCommand.name}`;
					let possibilites: { name: string; value: string }[] = [];
					let subcommandGroups = localCommand.options?.filter(
						(option) => option.type === ApplicationCommandOptionType.SubcommandGroup
					) as ApplicationCommandSubGroupData[];
					let firstLevelSubcommands = localCommand.options?.filter(
						(option) => option.type === ApplicationCommandOptionType.Subcommand
					) as ApplicationCommandSubCommandData[];
					for (const subCommandGroup of subcommandGroups ?? []) {
						let secondLevelsCommands = subCommandGroup.options?.filter(
							(option) => option.type === ApplicationCommandOptionType.Subcommand
						);
						for (const secondLevelCommand of secondLevelsCommands ?? []) {
							possibilites.push({
								name: `${commandName} ${subCommandGroup.name} ${secondLevelCommand.name}`,
								value: `${command.name} ${subCommandGroup.name} ${secondLevelCommand.name}`,
							});
						}
					}

					for (const firstLevelSubcommand of firstLevelSubcommands ?? []) {
						possibilites.push({
							name: `${commandName} ${firstLevelSubcommand.name}`,
							value: `${command.name} ${firstLevelSubcommand.name}`,
						});
					}

					//si il y a des sous groupes et/ou des sous commandes, on ne met pas la commande principale car elle devient innaccessible
					if (possibilites.length == 0) possibilites.push({ name: commandName, value: command.name });

					return possibilites;
				})
				.flat()
				.filter((command) => !!command.name && (!value || command.name.includes(value)));
			await interaction.respond(commandNames);
		}
	},

	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;

async function collectVariables(
	interaction: ChatInputCommandInteraction,
	options: ApplicationCommandOptionData[] | undefined
): Promise<Map<string, any>> {
	const collectorFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const valuesMap = new Map<string, any>();

	for await (const option of options ?? []) {
		let components: any[] = [];

		if (
			option.type === ApplicationCommandOptionType.String ||
			option.type === ApplicationCommandOptionType.Number ||
			option.type === ApplicationCommandOptionType.Integer
		) {
			components.push(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder().setCustomId(option.name).setLabel(option.name).setStyle(ButtonStyle.Primary)
				)
			);
		} else if (option.type === ApplicationCommandOptionType.Boolean) {
			components.push(
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(option.name)
						.setPlaceholder(option.name)
						.addOptions(
							new StringSelectMenuOptionBuilder().setLabel("Oui").setValue("true"),
							new StringSelectMenuOptionBuilder().setLabel("Non").setValue("false")
						)
						.setMaxValues(1)
						.setMinValues(1)
				)
			);
		} else if (option.type === ApplicationCommandOptionType.User) {
			components.push(
				new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
					new UserSelectMenuBuilder().setCustomId(option.name).setPlaceholder(option.name).setMaxValues(1).setMinValues(1)
				)
			);
		} else if (option.type === ApplicationCommandOptionType.Channel) {
			components.push(
				new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
					new ChannelSelectMenuBuilder().setCustomId(option.name).setPlaceholder(option.name).setMaxValues(1).setMinValues(1)
				)
			);
		} else if (option.type === ApplicationCommandOptionType.Role) {
			components.push(
				new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
					new RoleSelectMenuBuilder().setCustomId(option.name).setPlaceholder(option.name).setMaxValues(1).setMinValues(1)
				)
			);
		} else if (option.type === ApplicationCommandOptionType.Mentionable) {
			components.push(
				new ActionRowBuilder<MentionableSelectMenuBuilder>().addComponents(
					new MentionableSelectMenuBuilder().setCustomId(option.name).setPlaceholder(option.name).setMaxValues(1).setMinValues(1)
				)
			);
		} else {
			throw new Error(`Type d'option non géré : ${option.type}`);
		}

		//on ajoute le bouton de validation quel que soit le type de l'option
		let validationButton = new ButtonBuilder().setCustomId("validate").setLabel("Valider mon choix");
		if(option.required){
			validationButton.setStyle(ButtonStyle.Danger).setDisabled(true)
		}else{
			validationButton.setStyle(ButtonStyle.Success);
		}
		components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(validationButton));
		const messageContent = `Veuillez choisir une valeur pour l'option ${bold(option.name)}\n\nDescription de l'option : ${option.description}`;
		let message = await interaction.editReply({
			content: messageContent,
			components,
		});

		await new Promise<void>((resolve, reject) => {
			const collector = message.createMessageComponentCollector({ filter: collectorFilter ?? (() => true), time: 300000 });
			collector.on("end", (c, reason) => {
				if (reason == "time") {
					interaction.editReply({ content: "5 minutes se sont écoulés\nAnnulation de la demande", components: [] }).catch(() => {
						console.error("Error at message.edit in collectVariables\nIt seems that the message is unavailable and/or ephemeral");
					});
					reject();
				} else {
					interaction.editReply({ components: [] });
				}
			});
			collector.on("collect", (i) => {
				if (i.customId === "validate") {
					i.deferUpdate();
					collector.stop();
					resolve();
				} else {
					if (i.isAnySelectMenu() && i.values.length === 1) {
						let responseComponents = [...components];
						responseComponents[responseComponents.length - 1].components[0].setDisabled(false).setStyle(ButtonStyle.Success);
						valuesMap.set(option.name, i.values[0]);
						i.update({ components: responseComponents });
					} else if (i.isButton()) {
						//si c'est un bouton ça veut dire qu'on cherche à obtenir un string/number/integer donc on a besoin d'un modal
						const modalComponents = new ActionRowBuilder<TextInputBuilder>().addComponents(
							new TextInputBuilder()
								.setCustomId(option.name)
								.setLabel(option.name)
								.setPlaceholder(option.name)
								.setRequired(true)
								.setStyle(TextInputStyle.Short)
						);
						const modal = new ModalBuilder().setCustomId(option.name).setTitle(option.name).setComponents(modalComponents);
						i.showModal(modal);
						const filter = (subI: ModalSubmitInteraction) => subI.customId === modal.data.custom_id;
						interaction.awaitModalSubmit({ filter, time: 30_000 }).then((subI) => {
							valuesMap.set(option.name, subI.fields.getTextInputValue(option.name));
							let responseComponents = [...components];
							responseComponents[responseComponents.length - 1].components[0].setDisabled(false).setStyle(ButtonStyle.Success);
							i.editReply({
								content: messageContent + `\nValeur actuelle de l'option ${bold(option.name)} : ${valuesMap.get(option.name)}`,
								components: responseComponents,
							});
							subI.reply({ content: "valeur enregitrés", ephemeral: true }).then(() => {
								subI.deleteReply();
							});
						});
					}
				}
			});
		});
	}

	return valuesMap;
}
