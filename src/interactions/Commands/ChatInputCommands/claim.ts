import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";
import { rmSync } from "fs";
import { ObtentionWay } from "../../../classes/ObtentionWay";
import Anilist from "../../../classes/Anilist";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";
import { CustomEmotes } from "../../../utils/customEmotes";
import { guildDropCooldowns } from "./dropWaifu";

export default {
	dmPermission: false,
	description: "Claim a waifu",
	name: "claim",
	guilds: ["780715935593005088"],
	options: [{ type: ApplicationCommandOptionType.String, name: "name", description: "Waifu name", required: true }],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.deferred || interaction.replied) {
			interaction.editReply({ content: `${CustomEmotes.loading} ${interaction.client.user.username} réfléchit...` });
		} else {
			await interaction.deferReply({ ephemeral: true });
		}
		const userId = interaction.user.id;
		let userDatabaseProfile = await UserModel.findOne({ id: userId });
		if (!userDatabaseProfile) {
			//TODO : Handle user not in database
			await interaction.editReply("You don't have any profile");
		} else {
			const waifu = interaction.guild!.waifu;
			if(!waifu) {
				await interaction.editReply("There is no waifu to claim");
				return;
			}
			const waifuNames = [waifu.name.full, waifu.name.userPreferred, ...waifu.name.alternative, ...waifu.name.alternativeSpoiler].map((n) =>
				n.toLowerCase()
			);
			const userInput = interaction.options.getString("name") as string;
			if (waifuNames.includes(userInput.toLowerCase())) {
				if (userDatabaseProfile.waifus.map((w) => w.name).includes(waifu.name.full)) {
					await interaction.editReply("You already own this waifu");
					return;
				}
				userDatabaseProfile.waifus.push(Anilist.transformer.toDatabaseWaifu(waifu, ObtentionWay.claim));

				userDatabaseProfile.save();
				interaction.guild!.waifu = null;
				guildDropCooldowns.delete(interaction.guild!.id);
				await interaction.editReply("https://tenor.com/view/yes-gif-23999135");
				const { embeds } = customEmbeds.claimedWaifu(waifu, interaction.user.id);
				interaction.guild!.waifuMessage.edit({ embeds }).then(() => {
					rmSync(`./assets/images/${waifu.id}.png`);
				});
			} else {
				await interaction.editReply("Wrong name !");
			}
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
