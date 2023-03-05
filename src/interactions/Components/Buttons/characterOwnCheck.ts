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
	label: "J'ai déjà ?",
	async execute(interaction, ...args) {
		let userId = interaction.user.id;
		let waifuId = interaction.customId.split("-")[1];
		let userProfile = await UserModel.findOne({ id: userId });
		if (!userProfile) return interaction.reply({ content: "Vous n'avez pas de profil", ephemeral: true });
		if (userProfile.waifus.map(w => w.id.toString()).includes(waifuId)) {
			interaction.reply({ content: "Vous avez déjà cette waifu", ephemeral: true });
		} else {
			interaction.reply({ content: "Vous n'avez pas cette waifu", ephemeral: true });
		}
	},
} as InteractionButtonComponentData);
