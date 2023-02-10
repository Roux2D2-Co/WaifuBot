import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	Application,
	ApplicationCommandOptionType,
	ComponentType,
} from "discord.js";
import { UserModel } from "../../../database/models/user";
import { Waifu, WaifuSchema } from "../../../classes/Waifu";
import customEmbeds from "../../../utils/customEmbeds";
import { returnDominantColor } from "../../../utils/utils";
import { CustomEmotes } from "../../../utils/customEmotes";

export default {
	dmPermission: false,
	description: "Lister l'ensemble de vos personnages acquis",
	name: "list",
	guilds: ["780715935593005088"],
	options: [
		{
			name: "user",
			description: "L'utilisateur dont vous voulez voir la liste de waifus",
			type: ApplicationCommandOptionType.User,
			required: false,
		},
		{
			name: "series",
			description: "La série dont vous voulez voir la liste de waifus",
			type: ApplicationCommandOptionType.String,
			required: false,
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.deferred || interaction.replied) {
			interaction.editReply({ content: `${CustomEmotes.loading} ${interaction.client.user.username} réfléchit...` });
		} else {
			await interaction.deferReply({ ephemeral: false });
		}
		let user = interaction.user;
		let userOption = interaction.options.getUser("user");
		if (!!userOption) {
			user = userOption;
		}
		let userDatabaseProfile = await UserModel.findOne({ id: user.id });
		if (!userDatabaseProfile) {
			await interaction.editReply("Impossible vous n'avez pas d'identifiant !!");
			return;
		} else if (userDatabaseProfile!.waifus.length === 0) {
			await interaction.editReply("Vous n'avez pas encore de waifu.");
			return;
		} else {
			let waifuTab = userDatabaseProfile.waifus;
			let seriesOption = interaction.options.getString("series");
			if (!!seriesOption) {
				//check for all waifus if one of their media names is like the series option
				let waifusInSeries = [];
				for (let i = 0; i < waifuTab.length; i++) {
					let wai = waifuTab[i] as Waifu;
					if (wai.media == null) {
						continue;
					}
					if (wai.media.title.english == null) {
						continue;
					}
					if (wai.media.title.romaji == null) {
						continue;
					}
					if (
						wai.media.title.english.toLowerCase().includes(seriesOption.toLowerCase()) ||
						wai.media.title.romaji.toLowerCase().includes(seriesOption.toLowerCase())
					) {
						waifusInSeries.push(wai);
					}
				}
				if (waifusInSeries.length !== 0) {
					waifuTab = waifusInSeries;
				} else {
					await interaction.editReply({ content: "Aucune waifu n'a été trouvée dans cette série." });
					return;
				}
			}
			// Case when player has waifus to display
			let str: String;
			str = "Voici la liste de vos waifus : \n";
			let wai: Waifu;
			wai = waifuTab[0] as Waifu;
			str += wai.name + "\n";
			let buttonLeftminus10 = new ButtonBuilder()
				.setCustomId("goToOnList_2_" + user.id)
				.setStyle(ButtonStyle.Primary)
				.setEmoji("⏪");
			let buttonLeft = new ButtonBuilder()
				.setCustomId("goToOnList_0_" + user.id)
				.setStyle(ButtonStyle.Primary)
				.setEmoji("⬅️");
			let buttonRight = new ButtonBuilder()
				.setCustomId("goToOnList_1_" + user.id)
				.setStyle(ButtonStyle.Primary)
				.setEmoji("➡️");
			let buttonRightplus10 = new ButtonBuilder()
				.setCustomId("goToOnList_3_" + user.id)
				.setStyle(ButtonStyle.Primary)
				.setEmoji("⏩");
			var maxIndex = waifuTab.length - 1;
			var index = 0;
			let color = await returnDominantColor(wai.image);
			const { embeds } = customEmbeds.displayWaifuInlist(wai, index.toString(), maxIndex.toString(), user.username, color);
			let actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonLeftminus10, buttonLeft, buttonRight, buttonRightplus10);
			const response = await interaction.editReply({ embeds: embeds, components: [actionRow] });
			let collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 240000 });
			collector.on("collect", async (collectorInteraction) => {
				if (collectorInteraction.customId.includes("goToOnList")) {
					let user = interaction.user;
					let splitted = collectorInteraction.message.embeds[0].footer!.text.split(" ");
					let actualIndex = parseInt(splitted[splitted.length - 1].split("/")[0]) - 1;
					let actionToDo = parseInt(collectorInteraction.customId.split("_")[1]);
					switch (actionToDo) {
						case 0: {
							if (actualIndex <= 0) {
								actualIndex = maxIndex;
							} else {
								actualIndex--;
							}
							break;
						}
						case 1: {
							if (actualIndex >= maxIndex) {
								actualIndex = 0;
							} else {
								actualIndex++;
							}
							break;
						}
						case 2: {
							if (actualIndex - 10 < 0) {
								var diff = 0 - actualIndex + 10;
								actualIndex = maxIndex - diff;
								actualIndex++;
								if (actualIndex > maxIndex) {
									actualIndex = maxIndex;
								}
								if (actualIndex < 0) {
									actualIndex = 0;
								}
							} else {
								actualIndex -= 10;
							}
							break;
						}
						case 3: {
							if (actualIndex + 10 > maxIndex) {
								var diff = maxIndex - actualIndex - 10;
								actualIndex = 0 - diff;
								actualIndex--;
								if (actualIndex < 0) {
									actualIndex = 0;
								}
								if (actualIndex > maxIndex) {
									actualIndex = maxIndex;
								}
							} else {
								actualIndex += 10;
							}
							break;
						}
					}
					wai = waifuTab[actualIndex] as Waifu;
					color = await returnDominantColor(wai.image);
					const { embeds } = customEmbeds.updateWaifuInlist(wai, actualIndex.toString(), color, collectorInteraction.message.embeds[0]);
					await collectorInteraction.update({ embeds: embeds });
				}
			});
			collector.on("end", async (collected, reason) => {
				if (reason === "time") {
					await interaction.editReply({ embeds: embeds, components: [] });
				}
			});
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
