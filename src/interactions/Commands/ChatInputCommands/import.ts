import axios from "axios";
import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import { getAllMediasForAllWaifus } from "../../../utils/utils";
import { User, UserModel } from "../../../database/models/user";
import { CustomEmotes } from "../../../utils/customEmotes";

const WAIFU_API_URL = "https://waifuapi.karitham.dev/user/";
export default {
	dmPermission: false,
	description: "Import your profile from WaifuGui.karitham.dev",
	name: "import",
	guilds: ["780715935593005088"],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.deferred || interaction.replied) {
			interaction.editReply({ content: `${CustomEmotes.loading} ${interaction.client.user.username} réfléchit...` });
		}else{
			await interaction.deferReply({ ephemeral: true });
		}
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!!userDatabaseProfile) {
			await interaction.editReply("You already have a profile. Deletion before import");
			await UserModel.deleteOne({ id: userId });
		}
		const { data: userProfile, status } = await axios.get(`${WAIFU_API_URL}${userId}`, { transformResponse: (data) => JSON.parse(data) });
		if (status !== 200) {
			await interaction.editReply("An error occured while fetching your profile.");
			return;
		} else {
			userDatabaseProfile = new UserModel(userProfile);
			if (!await getAllMediasForAllWaifus(userDatabaseProfile as User)) {
				await interaction.editReply("An error occured while fetching your waifus' medias.");
				return;
			} else {
				await userDatabaseProfile.save();
				await interaction.editReply("Profile successfully imported !");
			}
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
