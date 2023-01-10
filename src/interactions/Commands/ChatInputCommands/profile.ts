import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandSubCommandData,
	ApplicationCommandOptionType,
} from "discord.js";
import customEmbeds from "../../../utils/customEmbeds";
import { UserModel, User } from "../../../database/models/user";

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
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: false });
		let subCommand = interaction.options.getSubcommand(true);
		let choosenSubcommand = this.options!.find((option) => option.name === subCommand) as ApplicationCommandSubCommandData;
		!!choosenSubcommand && !!choosenSubcommand.execute && choosenSubcommand.execute(interaction);
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
