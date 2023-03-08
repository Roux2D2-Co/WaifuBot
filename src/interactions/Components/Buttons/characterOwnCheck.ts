import { ButtonStyle, ComponentType, InteractionButtonComponentData } from "discord.js";
import CustomButton from "../../../classes/CustomButton";
import { UserModel } from "../../../database/models/user";

export default new CustomButton({
	customId: "characterOwnCheck",
	regexValidator: /characterOwnCheck-\d+/,
	style: ButtonStyle.Secondary,
	type: ComponentType.Button,
	disabled: false,
	emoji: "❓",
	label: "Do I own it ?",
	async execute(interaction, ...args) {
		let userId = interaction.user.id;
		let waifuId = interaction.customId.split("-")[1];
		let userProfile = await UserModel.findOne({ id: userId });
		if (!userProfile) return interaction.reply({ content: "You don't have a profile", ephemeral: true });
		if (userProfile.waifus.map(w => w.id.toString()).includes(waifuId)) {
			interaction.reply({ content: "You already have this waifu", ephemeral: true });
		} else {
			interaction.reply({ content: "You don't have this waifu", ephemeral: true });
		}
	},
} as InteractionButtonComponentData);
