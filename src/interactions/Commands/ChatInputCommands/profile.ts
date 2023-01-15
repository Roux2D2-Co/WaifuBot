import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandSubCommandData,
	ApplicationCommandOptionType,
	ApplicationCommandSubGroupData,
} from "discord.js";
import customEmbeds from "../../../utils/customEmbeds";
import { UserModel, User } from "../../../database/models/user";
import { autocompleteCharacter } from "../../../utils/utils";

export default {
	dmPermission: false,
	description: "Gérer votre profil",
	name: "profil",
	guilds: ["780715935593005088"],
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "view",
			description: "Voir votre profil",
			options: [
				{
					type: ApplicationCommandOptionType.User,
					description: "L'utilisateur dont vous voulez voir le profil",
					name: "user",
					required: false,
				},
			],
			execute: async (interaction: ChatInputCommandInteraction) => {
				let user = interaction.options.getUser("user", false) ?? interaction.user;
				let userProfile = await UserModel.findOne({ id: user.id });
				if (!userProfile) {
					await interaction.editReply("Ce profil n'existe pas.");
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
			description: "Editer votre profil",
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					description: "Mettre à jour votre citation de profil",
					name: "quote",
					options: [
						{
							type: ApplicationCommandOptionType.String,
							description: "Votre nouvelle citation",
							name: "quote",
							required: true,
						},
					],
					execute: async (interaction: ChatInputCommandInteraction) => {
						let user = interaction.user;
						let userProfile = await UserModel.findOne({ id: user.id });
						if (!userProfile) {
							await interaction.editReply("Vous n'avez pas de profil.");
							return;
						} else {
							let quote = interaction.options.getString("quote", true);
							userProfile.quote = quote;
							await userProfile.save();
							await interaction.editReply("Votre citation a bien été mise à jour.");
						}
					},
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					description: "Mettre à jour votre personnage favori",
					name: "favorite",
					options: [
						{
							type: ApplicationCommandOptionType.String,
							description: "Votre nouvelle personnage favori",
							name: "character",
							autocomplete: true,
							required: true,
						},
					],
					execute: async (interaction: ChatInputCommandInteraction) => {
						let user = interaction.user;
						let userProfile = await UserModel.findOne({ id: user.id });
						if (!userProfile) {
							await interaction.editReply("Vous n'avez pas de profil.");
							return;
						} else {
							let waifuId = interaction.options.getString("character", true);
							let newFavoriteWaifu = userProfile.waifus.find((waifu) => waifu.id.toString() === waifuId);
							userProfile.favorite = newFavoriteWaifu;
							userProfile.save();
							await interaction.editReply("Votre personnage favori a bien été mise à jour.");
						}
					},
				},
			],
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: false });
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

	onAutocomplete : autocompleteCharacter,
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
