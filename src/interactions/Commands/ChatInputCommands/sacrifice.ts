import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
} from "discord.js";
import { UserModel } from "../../../database/models/user";
import config from "../../../config.json";

export default {
	dmPermission: false,
	description: "Sacrifier une waifu en échange d'un token",
	name: "sacrifice",
	guilds: ["780715935593005088"],
	options: [
		{
			type: ApplicationCommandOptionType.String,
			description: "Le personnage à sacrifier",
			name: "character",
			autocomplete: true,
			required: true,
		},
	],
	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: false });
		let user = interaction.user;
		let userProfile = await UserModel.findOne({ id: user.id });
		if (!userProfile || userProfile.waifus.length === 0) {
			await interaction.editReply("Vous n'avez pas de waifu.");
			return;
		} else {
			let waifuId = interaction.options.getString("character", true);
      let waifu = userProfile.waifus.find((w) => w.id.toString() === waifuId);

			await UserModel.findOneAndUpdate({ id: user.id }, { $pull: { waifus: { id: parseInt(waifuId) } }, $inc: { tokens: config.TOKEN_PER_SACRIFICE } });
			await interaction.editReply(`Vous avez sacrifié ${waifu!.name} pour ${config.TOKEN_PER_SACRIFICE} token${config.TOKEN_PER_SACRIFICE > 1 ? "s" : ""}`);
		}
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
