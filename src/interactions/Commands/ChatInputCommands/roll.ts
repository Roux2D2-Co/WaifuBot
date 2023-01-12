import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import { ObtentionWay } from "../../../classes/ObtentionWay";
import Anilist from "../../../classes/Anilist";
import { User, UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";

export default {
	dmPermission: false,
	description: "Roll une waifu",
	name: "roll",
	guilds: ["780715935593005088"],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: false });
		const userId = interaction.user.id;
		let userDatabaseProfile = (await UserModel.findOne({ id: userId }));
		if (!userDatabaseProfile) {
			//TODO : Gérer le cas où le mec a pas de profil
			await interaction.editReply("Fuck j'ai pas géré le cas où le mec a pas de profil");
		} else {
			const waifu = await Anilist.getRandomCharacter(userDatabaseProfile.waifus.map((w) => w.id));
			userDatabaseProfile.waifus.push(Anilist.transformer.toDatabaseWaifu(waifu, ObtentionWay.roll));
			userDatabaseProfile.save();
			const { embeds } = await customEmbeds.rolledWaifu(waifu);
			interaction.editReply({ embeds });
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
