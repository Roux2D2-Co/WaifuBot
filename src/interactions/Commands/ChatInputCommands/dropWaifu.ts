import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ChannelType } from "discord.js";
import Anilist from "../../../classes/Anilist";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";

export default {
	dmPermission: false,
	description: "Fait apparaitre une waifu",
	name: "drop",
	guilds: ["780715935593005088"],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: false });
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!userDatabaseProfile) {
			//TODO : Gérer le cas où le mec a pas de profil
			await interaction.editReply("Fuck j'ai pas géré le cas où le mec a pas de profil");
		} else {
			const randomWaifu = await Anilist.getRandomCharacter();
			interaction.guild!.waifu = randomWaifu;
			const { embeds, files } = await customEmbeds.randomWaifu(randomWaifu);
			interaction.guild?.channels.fetch(interaction.channelId).then((c) => {
				if (!c || c.type != ChannelType.GuildText) return;
				c.send({ embeds, files }).then((m) => (interaction.guild!.waifuMessage = m));
				interaction.deleteReply();
				console.log(randomWaifu.name);
			});
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
