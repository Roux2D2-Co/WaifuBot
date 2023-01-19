import axios from "axios";
import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import { getAllMediasForAllWaifus } from "../../../utils/utils";
import { User, UserModel } from "../../../database/models/user";

const WAIFU_API_URL = "https://waifuapi.karitham.dev/user/";
export default {
	dmPermission: false,
	description: "Importer votre profil depuis WaifuGui.karitham.dev",
	name: "import",
	guilds: ["780715935593005088"],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: true });
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!!userDatabaseProfile) {
			await interaction.editReply("Votre profil a déjà été importé... Suppression...");
			await UserModel.deleteOne({ id: userId });
		}
		const { data: userProfile, status } = await axios.get(`${WAIFU_API_URL}${userId}`, { transformResponse: (data) => JSON.parse(data) });
		if (status !== 200) {
			await interaction.editReply("Une erreur est survenue lors de la récupération de votre profil.");
			return;
		} else {
			userDatabaseProfile = new UserModel(userProfile);
			if (!await getAllMediasForAllWaifus(userDatabaseProfile as User)) {
				await interaction.editReply("Une erreur est survenue lors de la récupération des médias de vos waifus.");
				return;
			} else {
				await userDatabaseProfile.save();
				await interaction.editReply("Votre profil a bien été importé.");
			}
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
