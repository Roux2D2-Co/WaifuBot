import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";
import { rmSync } from "fs";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";

export default {
	dmPermission: false,
	description: "Claim une waifu",
	name: "claim",
	guilds: ["780715935593005088"],
	options: [{ type: ApplicationCommandOptionType.String, name: "name", description: "Le nom de la waifu", required: true }],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: true });
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!userDatabaseProfile) {
			//TODO : Gérer le cas où le mec a pas de profil
			await interaction.editReply("Fuck j'ai pas géré le cas où le mec a pas de profil");
		} else {
			const waifu = interaction.guild!.waifu;
			const waifuNames = [waifu.name.full, waifu.name.userPreferred, ...waifu.name.alternative, ...waifu.name.alternativeSpoiler].map((n) =>
				n.toLowerCase()
			);
			const userInput = interaction.options.getString("name") as string;
			if (waifuNames.includes(userInput.toLowerCase())) {
				interaction.guild!.waifu == null;
				await interaction.editReply("https://tenor.com/view/yes-gif-23999135");
				const { embeds } = customEmbeds.claimedWaifu(waifu, interaction.user.id);
				interaction.guild!.waifuMessage.edit({ embeds }).then(() => {
					rmSync(`./assets/images/${waifu.id}.png`);
				});
			} else {
				await interaction.editReply("Nope");
			}
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
