import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import { ObtentionWay } from "../../../classes/ObtentionWay";
import Anilist from "../../../classes/Anilist";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";

import config from "../../../config.json";

export default {
	dmPermission: false,
	description: "Roll une waifu",
	name: "roll",
	guilds: ["780715935593005088"],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!userDatabaseProfile) {
			//TODO : Gérer le cas où le mec a pas de profil
			await interaction.editReply("Fuck j'ai pas géré le cas où le mec a pas de profil");
		} else if (userDatabaseProfile.nextRoll > new Date()) {
			await interaction.reply({
				content: `Next roll availability : <t:${Math.round(userDatabaseProfile.nextRoll.getTime() / 1000)}:R>`,
				ephemeral: true,
			});
			return;
		} else {
			const waifu = await Anilist.getRandomCharacter(userDatabaseProfile.waifus.map((w) => w.id));
			userDatabaseProfile.waifus.push(Anilist.transformer.toDatabaseWaifu(waifu, ObtentionWay.roll));
			userDatabaseProfile.nextRoll = new Date(Date.now() + config.ROLL_COOLDOWN);
			userDatabaseProfile.save();
			const { embeds } = await customEmbeds.rolledWaifu(waifu);
			interaction.reply({ embeds });
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
