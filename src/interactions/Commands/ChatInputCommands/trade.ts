import { createReadStream, createWriteStream, rmSync } from "fs";
import {
	ChatInputApplicationCommandData,
	ApplicationCommandType,
	ChatInputCommandInteraction,
	ApplicationCommandOptionType,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	bold,
	AutocompleteInteraction,
} from "discord.js";
import { UserModel, User } from "../../../database/models/user";
import Anilist from "../../../classes/Anilist";

import * as PImage from "pureimage";
import { Document } from "mongoose";
import { randomInt } from "../../../utils/utils";
import customEmbeds from "../../../utils/customEmbeds";
import { ObtentionWay } from "../../../classes/ObtentionWay";
const charImageDimensions = { width: 128, height: 213 };
const users: { [key: string]: Document<any, any, User> } = {};

export default {
	dmPermission: false,
	description: "Suggest a waifu trade with another user.",
	descriptionLocalizations: {
		fr: "Proposez un échange de waifu avec un autre utilisateur.",
	},
	name: "trade",
	guilds: ["780715935593005088"],
	options: [
		{
			name: "user",
			description: "The user with whom you want to trade.",
			descriptionLocalizations: {
				fr: "L'utilisateur avec qui vous souhaitez échanger.",
			},
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "give",
			description: "The waifu you want to give.",
			descriptionLocalizations: {
				fr: "La waifu que vous souhaitez donner.",
			},
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
		{
			name: "receive",
			description: "The waifu you want to receive.",
			descriptionLocalizations: {
				fr: "La waifu que vous souhaitez recevoir.",
			},
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		// await interaction.deferReply({ ephemeral: false });
		const userOne = interaction.user;
		const userOneId = userOne.id;
		const userOneDatabaseProfile = await UserModel.findOne({ id: userOneId });
		if (!userOneDatabaseProfile) {
			await interaction.reply({ content: "You don't have a profile registered.", ephemeral: true });
			return;
		}

		const userTwo = interaction.options.getUser("user")!;

		const userTwoId = userTwo.id;
		const userTwoDatabaseProfile = await UserModel.findOne({ id: userTwoId });
		if (!userTwoDatabaseProfile) {
			await interaction.reply({ content: "The user with whom you want to trade doesn't have a profile registered.", ephemeral: true });
			return;
		}

		const userOneWaifuId = interaction.options.getString("give")!;
		const userTwoWaifuId = interaction.options.getString("receive")!;

		const userOneWaifuList = userOneDatabaseProfile.waifus;
		const userTwoWaifuList = userTwoDatabaseProfile.waifus;

		if (userOneWaifuList === undefined || userOneWaifuList.length === 0) {
			await interaction.reply({ content: "You don't have any waifu registered.", ephemeral: true });
			return;
		}

		if (userTwoWaifuList === undefined || userTwoWaifuList.length === 0) {
			await interaction.reply({ content: "The user with whom you want to trade doesn't have any waifu registered.", ephemeral: true });
			return;
		}

		const userOneWaifu = userOneWaifuList.find((waifu) => waifu.id.toString() === userOneWaifuId);
		const userTwoWaifu = userTwoWaifuList.find((waifu) => waifu.id.toString() === userTwoWaifuId);

		const userOneAnilistWaifu = await Anilist.getWaifuById(userOneWaifuId);
		const userTwoAnilistWaifu = await Anilist.getWaifuById(userTwoWaifuId);

		if (!userOneWaifu) {
			await interaction.reply({ content: `You don't have ${bold(userOneAnilistWaifu.name.full)} registered.`, ephemeral: true });
			return;
		}

		if (!userTwoWaifu) {
			await interaction.reply({
				content: `The user with whom you want to trade doesn't have ${bold(userTwoAnilistWaifu.name.full)} registered.`,
				ephemeral: true,
			});
			return;
		}

		if (userOneWaifuList.find((waifu) => waifu.id.toString() === userTwoWaifuId)) {
			await interaction.reply({ content: `You already have ${bold(userTwoAnilistWaifu.name.full)}.`, ephemeral: true });
			return;
		}

		if (userTwoWaifuList.find((waifu) => waifu.id.toString() === userOneWaifuId)) {
			await interaction.reply({
				content: `The user with whom you want to trade already have ${bold(userOneAnilistWaifu.name.full)}.`,
				ephemeral: true,
			});
			return;
		}

		const megaCanvas = PImage.make(charImageDimensions.width * 3, charImageDimensions.height, {});
		const c = megaCanvas.getContext("2d");
		c.clearRect(0, 0, megaCanvas.width, megaCanvas.height);

		const userOneWaifuImageReadStream = createReadStream(`./assets/images/${userOneAnilistWaifu.id}.png`);
		const userOneWaifuImage = await PImage[userOneAnilistWaifu.image.large.endsWith("png") ? "decodePNGFromStream" : "decodeJPEGFromStream"](
			userOneWaifuImageReadStream
		);
		await c.drawImage(
			userOneWaifuImage,
			0,
			0,
			userOneWaifuImage.width,
			userOneWaifuImage.height, // source dimensions
			0,
			0,
			charImageDimensions.width,
			charImageDimensions.height // destination dimensions
		);

		const userTwoWaifuImageReadStream = createReadStream(`./assets/images/${userTwoAnilistWaifu.id}.png`);
		const userTwoWaifuImage = await PImage[userTwoAnilistWaifu.image.large.endsWith("png") ? "decodePNGFromStream" : "decodeJPEGFromStream"](
			userTwoWaifuImageReadStream
		);
		await c.drawImage(
			userTwoWaifuImage,
			0,
			0,
			userTwoWaifuImage.width,
			userTwoWaifuImage.height, // source dimensions
			charImageDimensions.width * 2, //Décalage de 2 fois la largeur de l'image sur la gauche pour avoir de l'espace au milieu
			0,
			charImageDimensions.width,
			charImageDimensions.height // destination dimensions
		);

		const imageName = `./assets/images/trade-${randomInt(99999)}.png`;
		await PImage.encodePNGToStream(megaCanvas, createWriteStream(imageName));
		const { embeds, files } = customEmbeds.tradeWaifus(
			[
				{ userId: userOneId, waifu: userOneAnilistWaifu },
				{ userId: userTwoId, waifu: userTwoAnilistWaifu },
			],
			imageName
		);

		const accept = new ButtonBuilder().setCustomId("accept").setLabel("Accept").setStyle(ButtonStyle.Success).setEmoji("👍");

		const decline = new ButtonBuilder().setCustomId("decline").setLabel("Decline").setStyle(ButtonStyle.Danger).setEmoji("👎");

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(accept, decline);

		await interaction.deferReply({ ephemeral: false });
		await interaction.editReply({ embeds, files, components: [row] }).then((message) => {
			// Wait for the user to accept or decline the trade request (1 minute)
			// Only accept if the user who clicked is the user who received the trade request
			// Both users can decline the trade
			message
				.awaitMessageComponent({
					filter: (i) => i.user.id === userTwoId || (i.user.id === userOneId && i.customId !== "accept"),
					time: 60000,
				})
				.then(async (i) => {
					if (i.customId === "accept") {
						console.log("Exchange accepted");

						userOneDatabaseProfile.waifus.push(Anilist.transformer.toDatabaseWaifu(userTwoAnilistWaifu, ObtentionWay.trade));
						userTwoDatabaseProfile.waifus.push(Anilist.transformer.toDatabaseWaifu(userOneAnilistWaifu, ObtentionWay.trade));

						console.debug(
							userOneDatabaseProfile.waifus.splice(
								userOneDatabaseProfile.waifus.findIndex((waifu) => waifu.id.toString() === userOneWaifuId),
								1
							)
						);
						console.debug(
							userTwoDatabaseProfile.waifus.splice(
								userTwoDatabaseProfile.waifus.findIndex((waifu) => waifu.id.toString() === userTwoWaifuId),
								1
							)
						);

						// Save the new waifus
						userOneDatabaseProfile.save();
						userTwoDatabaseProfile.save();

						// Get the success embed to replace the original embed
						const { embeds } = customEmbeds.tradeSuccess(
							[
								{ userId: userOneId, waifu: userOneAnilistWaifu },
								{ userId: userTwoId, waifu: userTwoAnilistWaifu },
							],
							imageName
						);
						interaction.editReply({ embeds, components: [] });
					} else if (i.customId === "decline") {
						console.log("Exchange declined");
						embeds[0]
							.setTitle("Trade was declined.")
							.setColor(0xff0000)
							.setDescription(`The trade from <@${userOneId}> to <@${userTwoId}> was declined by <@${i.user.id}>.`);
						interaction.editReply({ embeds, files, components: [] });
					} else {
						console.log("Echange annulé");
					}
					// If there is an error, log it and cancel the trade
					// If the user doesn't answer in time, cancel the trade
				})
				.catch((err) => {
					embeds[0]
						.setTitle("Trade was canceled.")
						.setColor(0xff6600)
						.setDescription(`The trade from <@${userOneId}> to <@${userTwoId}> was canceled.\n(Delay expired)`);
					interaction.editReply({ embeds, files, components: [] });
				})
				.then(() => {
					rmSync(imageName);
				});
		});
	},
	type: ApplicationCommandType.ChatInput,

	onAutocomplete: async (interaction: AutocompleteInteraction) => {
		let focusedOption = interaction.options.getFocused(true);
		let user;
		if (focusedOption.name === "give") {
			user = interaction.user;
		} else if (focusedOption.name === "receive") {
			let targetUserOption = interaction.options.get("user");
			if (!targetUserOption || !targetUserOption.value) {
				return interaction.respond([]);
			} else {
				user = await interaction.guild?.members.fetch(targetUserOption.value as string);
			}
		}
		if (!user) return interaction.respond([]);

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
} as ChatInputApplicationCommandData;
