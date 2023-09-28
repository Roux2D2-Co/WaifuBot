import { ButtonStyle, ComponentType, EmbedBuilder, Emoji, InteractionButtonComponentData, time } from "discord.js";
import Anilist from "../../../classes/Anilist";
import CustomButton from "../../../classes/CustomButton";
import config from "../../../config.json";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";

export default new CustomButton({
	customId: "rollWithTokens",
	regexValidator: /rollWithTokens-(\d+)-(10|[1-9])/,
	async execute(interaction, ...args): Promise<void> {
		const regexResult = this.regexValidator!.exec(interaction.customId);
		if (!regexResult) return;
		const userId = regexResult[1];
		const rollCount = parseInt(regexResult[2]);
		const userDatabaseProfile = await UserModel.findOne({ id: userId });

		if (!userDatabaseProfile) {
			console.log(interaction.customId, userId, rollCount);
			await interaction.update({ content: "You don't have a profile" });
			return;
		}
		interaction.reply({ content: `${interaction.member} is rolling ${rollCount} times...`, ephemeral: false });
		const allWaifus = userDatabaseProfile.waifus;
		const allWaifusId = userDatabaseProfile.waifus.map((w) => w.id);
		const embeds = [];

		for (let i = 0; i < rollCount; i++) {
			const waifu = await Anilist.getRandomCharacter(allWaifusId);
			allWaifusId.push(waifu.id);
			let { embeds: embed } = await customEmbeds.rolledWaifu(waifu);
			allWaifus.push(Anilist.transformer.toDatabaseWaifu(waifu));
			embeds.push(embed);
		}
		await userDatabaseProfile.update({ waifus: allWaifus, tokens: userDatabaseProfile.tokens - rollCount * config.TOKENS_PER_ROLL });
		interaction.editReply({ content: `${interaction.member} rolled ${rollCount} times...`, embeds: embeds.flat() });
	},
	style: ButtonStyle.Primary,
	type: ComponentType.Button,
	disabled: false,
	label: "placeholder",
	emoji: "🎲",
} as InteractionButtonComponentData);
