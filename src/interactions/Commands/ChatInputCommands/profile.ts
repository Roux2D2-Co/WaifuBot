import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandSubCommandData,
	ApplicationCommandOptionType,
	ApplicationCommandSubGroupData,
	AutocompleteInteraction,
} from "discord.js";
import customEmbeds from "../../../utils/customEmbeds";
import { UserModel, User } from "../../../database/models/user";
import { CustomEmotes } from "../../../utils/customEmotes";

export default {
	dmPermission: false,
	description: "Gérer votre profil",
	name: "profile",
	guilds: ["780715935593005088"],
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "view",
			description: "See your profile",
			options: [
				{
					type: ApplicationCommandOptionType.User,
					description: "User to see profile of",
					name: "user",
					required: false,
				},
			],
			execute: async (interaction: ChatInputCommandInteraction) => {
				let user = interaction.options.getUser("user", false) ?? interaction.user;
				let userProfile = await UserModel.findOne({ id: user.id });
				if (!userProfile) {
					await interaction.editReply("This user doesn't have a profile.");
					return;
				} else {
					let { embeds } = customEmbeds.profile(userProfile as User, user);
					await interaction.editReply({ embeds });
				}
			},
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: "edit",
			description: "Edit your profile",
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					description: "Update your quote",
					name: "quote",
					options: [
						{
							type: ApplicationCommandOptionType.String,
							description: "new quote",
							name: "quote",
							required: true,
						},
					],
					execute: async (interaction: ChatInputCommandInteraction) => {
						let user = interaction.user;
						let userProfile = await UserModel.findOne({ id: user.id });
						if (!userProfile) {
							await interaction.editReply("You don't have a profile.");
							return;
						} else {
							let quote = interaction.options.getString("quote", true);
							userProfile.quote = quote;
							await userProfile.save();
							await interaction.editReply("Your quote has been updated.");
						}
					},
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					description: "Edit your favorite character",
					name: "favorite",
					options: [
						{
							type: ApplicationCommandOptionType.String,
							description: "Your favorite character",
							name: "character",
							autocomplete: true,
							required: true,
						},
					],
					execute: async (interaction: ChatInputCommandInteraction) => {
						let user = interaction.user;
						let userProfile = await UserModel.findOne({ id: user.id });
						if (!userProfile) {
							//TODO: Add a link to the import command
							await interaction.editReply("You don't have a profile.");
							return;
						} else {
							let waifuId = interaction.options.getString("character", true);
							let newFavoriteWaifu = userProfile.waifus.find((waifu) => waifu.id.toString() === waifuId);
							userProfile.favorite = newFavoriteWaifu;
							userProfile.save();
							await interaction.editReply("Your favorite character has been updated.");
						}
					},
				},
			],
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.deferred || interaction.replied) {
			interaction.editReply({ content: `${CustomEmotes.loading} ${interaction.client.user.username} réfléchit...` });
		} else {
			await interaction.deferReply({ ephemeral: false });
		}
		let subcommandGroup = interaction.options.getSubcommandGroup(false);
		let subCommand = interaction.options.getSubcommand(true);
		let choosenSubcommand: ApplicationCommandSubCommandData | undefined;
		if (!!subcommandGroup) {
			let choosenSubcommandGroup = this.options!.find((option) => option.name === subcommandGroup) as ApplicationCommandSubGroupData;
			choosenSubcommand = choosenSubcommandGroup.options?.find((option) => option.name === subCommand) as ApplicationCommandSubCommandData;
		} else {
			choosenSubcommand = this.options!.find((option) => option.name === subCommand) as ApplicationCommandSubCommandData;
		}
		!!choosenSubcommand && !!choosenSubcommand.execute && choosenSubcommand.execute(interaction);
	},

	onAutocomplete: async (interaction: AutocompleteInteraction) => {
		let focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name !== "character") return;
		let user = interaction.user;
		let userProfile = await UserModel.findOne({ id: user.id });
		if (!userProfile || userProfile.waifus.length === 0) {
			return interaction.respond([]);
		} else {
			let waifus = userProfile.waifus;
			let input = focusedOption.value.toLowerCase();
			let filteredWaifus = waifus.filter((waifu) => waifu.name.toLowerCase().includes(input));
			let waifuOptions = filteredWaifus
				.map((waifu) => {
					return { name: waifu.name, value: waifu.id.toString() };
				})
				.splice(0, 25);
			return interaction.respond(waifuOptions);
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
