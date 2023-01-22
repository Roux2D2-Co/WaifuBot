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
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ModalSubmitInteraction,
	bold,
	GuildMemberResolvable,
	UserResolvable,
	APIChatInputApplicationCommandInteractionData,
	APIApplicationCommandInteractionWrapper,
} from "discord.js";
import { client } from "../../../index";
import { readdirSync, writeFileSync } from "fs";
import { MockedInteraction } from "../../../utils/discordMock";

const localCommands = new Map<string, ChatInputApplicationCommandData>();
const thisFileName = __filename.split("\\").reverse()[0];
const getFullCommandPath = /(?<command>\w+?(?= |$))(?: ?(?<subCommandGroup>\w+?(?= |$|\W))?(?=.+$) ?(?<subCommand>\w+))?/gm;
type CommandNames = { command: string; subCommandGroup?: string; subCommand?: string };

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
				let commandPath = interaction.options.getString("command", true);
				let { command, subCommandGroup, subCommand } = (getFullCommandPath.exec(commandPath)?.groups as CommandNames) ?? {
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
				const options: OptionAndValue[] = [];
				for (const [, value] of optionsMap) {
					options.push(value);
				}

				const interactionJson = interaction.toJSON() as { [key: string]: any };
				interactionJson.options = interaction.options.data;
				const newInteraction = (await getNewInteraction(
					interaction,
					{ command, subCommandGroup, subCommand },
					options
				)) as ChatInputCommandInteraction;
				try {
					localCommand.execute(newInteraction);
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

type OptionAndValue = ApplicationCommandOptionData & { value: any };

async function collectVariables(
	interaction: ChatInputCommandInteraction,
	options: ApplicationCommandOptionData[] | undefined
): Promise<Map<string, OptionAndValue>> {
	const collectorFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const valuesMap = new Map<string, OptionAndValue>();

	for await (const option of (options as OptionAndValue[]) ?? []) {
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
		if (option.required) {
			validationButton.setStyle(ButtonStyle.Danger).setDisabled(true);
		} else {
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
						option.value = i.values[0];
						valuesMap.set(option.name, option);
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
							option.value = subI.fields.getTextInputValue(option.name);
							valuesMap.set(option.name, option);
							let responseComponents = [...components];
							responseComponents[responseComponents.length - 1].components[0].setDisabled(false).setStyle(ButtonStyle.Success);
							i.editReply({
								content: messageContent + `\nValeur actuelle de l'option ${bold(option.name)} : ${option.value}`,
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

async function getNewInteraction(interaction: ChatInputCommandInteraction, commandNames: CommandNames, options: OptionAndValue[] = []) {
	const localCommand = localCommands.get(commandNames.command)!;
	let discordCommand;
	if (!!localCommand.guilds && localCommand.guilds.length > 0) {
		discordCommand = await interaction.guild?.commands.fetch().then((cList) => cList.find((c) => c.name === commandNames.command));
	} else {
		discordCommand = await interaction.client.application?.commands.fetch().then((cList) => cList.find((c) => c.name === commandNames.command));
	}

	const targetUser = interaction.options.getUser("user", true);
	const targetMember = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
	const target = {
		user: {
			username: targetUser?.username,
			public_flags: targetUser?.flags?.bitfield,
			id: targetUser.id,
			discriminator: targetUser.discriminator,
			avatar: targetUser.avatar,
		},
		roles: Array.isArray(targetMember?.roles) ? targetMember?.roles : targetMember?.roles.cache.map((r) => r.id),
		premium_since: targetMember?.premiumSinceTimestamp,
		permissions: targetMember?.permissions.bitfield,
		pending: targetMember?.pending,
		nick: targetMember?.nickname,
		mute: targetMember?.voice.mute,
		joined_at: targetMember?.joinedAt?.toISOString(),
		is_pending: targetMember?.pending,
		flags: 0,
		deaf: targetMember?.voice.deaf,
		communication_disabled_until: targetMember?.communicationDisabledUntilTimestamp,
		avatar: targetMember?.avatar,
	};

	const resolved: { members: { [key: string]: GuildMemberResolvable }; users: { [key: string]: UserResolvable } } = { members: {}, users: {} };

	const formattedOptions = options.map((o) => {
		if (o.type === ApplicationCommandOptionType.User || o.type === ApplicationCommandOptionType.Mentionable) {
			client.users.fetch(o.value).then((u) => {
				resolved.users[u.id] = u;

				interaction.guild?.members.fetch(u.id).then((m) => {
					if (m) resolved.members[u.id] = m;
					else throw new Error("Member not found");
				});
			});
		}

		return {
			name: o.name,
			type: o.type,
			value: o.value,
		};
	});

	const subCommandGroup = localCommand.options?.find((o) => o.name === commandNames.subCommandGroup) as ApplicationCommandSubGroupData;
	const subCommand = (subCommandGroup || localCommand)?.options?.find(
		(o) => o.name === commandNames.subCommand
	) as ApplicationCommandSubCommandData;

	const commandOptions = [];
	if (!!subCommand) {
		if (!!subCommandGroup) {
			commandOptions.push({
				name: subCommandGroup.name,
				type: subCommandGroup.type,
				options: [
					{
						name: subCommand.name,
						type: subCommand.type,
						options: formattedOptions,
					},
				],
			});
		} else {
			commandOptions.push({
				name: subCommand.name,
				type: subCommand.type,
				options: formattedOptions,
			});
		}
	} else {
		commandOptions.push(...formattedOptions);
	}

	if (!discordCommand) throw new Error("Command not found");
	const interactionJson = {} as {
		[key in keyof APIApplicationCommandInteractionWrapper<APIChatInputApplicationCommandInteractionData>]: any;
	};
	interactionJson.token = interaction.token;
	interactionJson.app_permissions = interaction.appPermissions?.bitfield;
	interactionJson.application_id = discordCommand.applicationId;
	interactionJson.channel_id = interaction.channelId;
	interactionJson.guild_id = discordCommand.guildId;
	interactionJson.id = interaction.id;
	interactionJson.guild_locale = interaction.guildLocale;
	interactionJson.locale = interaction.locale;
	interactionJson.member = target;
	interactionJson.token = interaction.token;
	interactionJson.type = discordCommand.type;
	interactionJson.version = discordCommand.version;
	interactionJson.data = {
		id: discordCommand.id,
		name: discordCommand.name,
		guild_id: interaction.guildId,
		type: discordCommand.type,
		resolved,
		options: commandOptions,
	};
	let e = new MockedInteraction(client, interactionJson);
	e.replied = true;
	e.ephemeral = true;
	return e;
}
