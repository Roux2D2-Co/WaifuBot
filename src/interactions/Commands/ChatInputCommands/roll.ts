import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { ObtentionWay } from "../../../classes/ObtentionWay";
import Anilist from "../../../classes/Anilist";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";
import rollWithTokensButton from "../../Components/Buttons/rollWithTokens";
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
			if (userDatabaseProfile.tokens >= config.TOKENS_PER_ROLL) {
				let actionRow = new ActionRowBuilder<ButtonBuilder>();
				let roll1 = rollWithTokensButton.build();
				roll1.setCustomId(`${rollWithTokensButton.customId}-${userId}-1`).setLabel("Roll 1 fois");
				actionRow.addComponents([roll1]);

				let roll5 = rollWithTokensButton.build();
				roll5.setCustomId(`${rollWithTokensButton.customId}-${userId}-5`).setLabel("Roll 5 fois");
				if (userDatabaseProfile.tokens < config.TOKENS_PER_ROLL * 5) {
					roll5.setDisabled(true);
				}
				actionRow.addComponents([roll5]);

				let roll10 = rollWithTokensButton.build();
				roll10.setCustomId(`${rollWithTokensButton.customId}-${userId}-10`).setLabel("Roll 10 fois");
				if (userDatabaseProfile.tokens < config.TOKENS_PER_ROLL * 10) {
					roll10.setDisabled(true);
					let rollMax = rollWithTokensButton.build();
					let maxRollCount = Math.floor(userDatabaseProfile.tokens / config.TOKENS_PER_ROLL);
					rollMax.setCustomId(`${rollWithTokensButton.customId}-${userId}-${maxRollCount}`).setLabel(`Roll max (${maxRollCount})`);
					actionRow.addComponents([roll10, rollMax]);
				} else {
					actionRow.addComponents([roll10]);
				}

				await interaction.reply({
					content: `Vous avez assez de tokens pour roll !`,
					components: [actionRow],
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: `Next roll availability : <t:${Math.round(userDatabaseProfile.nextRoll.getTime() / 1000)}:R>`,
					ephemeral: true,
				});
			}
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
