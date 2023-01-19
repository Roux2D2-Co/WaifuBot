import { createReadStream, createWriteStream, rmSync } from "fs";
import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, bold } from "discord.js";
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
	description: "Proposer un échange à un utilisateur.",
	name: "trade",
	guilds: ["780715935593005088"],
	options: [
		{
			name: "user",
			description: "L'utilisateur avec qui vous souhaitez échanger.",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "give",
			description: "Votre waifu à échanger.",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "receive",
			description: "La waifu que vous souhaitez recevoir.",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		// await interaction.deferReply({ ephemeral: false });
		const userOne = interaction.user;
		const userOneId = userOne.id;
		const userOneDatabaseProfile = await UserModel.findOne({ id: userOneId }); // TODO: users[userOneId] ??
		if (!userOneDatabaseProfile) {
			await interaction.reply({ content: "You don't have a profile registered.", ephemeral: true });
			return;
		}

		const userTwo = interaction.options.getUser("user")!;

		const userTwoId = userTwo.id;
		const userTwoDatabaseProfile = await UserModel.findOne({ id: userTwoId }); // TODO: users[userOneId] ??
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
			await interaction.reply({ content: `The user with whom you want to trade doesn't have ${bold(userTwoAnilistWaifu.name.full)} registered.`, ephemeral: true });
			return;
		}


		const megaCanvas = PImage.make(charImageDimensions.width * 3, charImageDimensions.height, {});
		const c = megaCanvas.getContext("2d");

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

		const accept = new ButtonBuilder()
			.setCustomId('accept')
			.setLabel('Accept')
			.setStyle(ButtonStyle.Success).setEmoji("👍");

		const decline = new ButtonBuilder()
			.setCustomId('decline')
			.setLabel('Decline')
			.setStyle(ButtonStyle.Danger).setEmoji("👎");

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				accept, decline
			);



		await interaction.editReply({ embeds, files, components: [row] }).then((message) => {
			message.awaitMessageComponent({ filter: (i) => i.user.id === userTwoId, time: 60000 }).then(async (i) => {
				if (i.customId === 'accept') {
					console.log("Echange accepté");

					userOneDatabaseProfile.waifus.push(Anilist.transformer.toDatabaseWaifu(userTwoAnilistWaifu, ObtentionWay.trade));
					userTwoDatabaseProfile.waifus.push(Anilist.transformer.toDatabaseWaifu(userOneAnilistWaifu, ObtentionWay.trade));

					console.debug(userOneDatabaseProfile.waifus.splice(userOneDatabaseProfile.waifus.findIndex((waifu) => waifu.id.toString() === userOneWaifuId), 1));
					console.debug(userTwoDatabaseProfile.waifus.splice(userTwoDatabaseProfile.waifus.findIndex((waifu) => waifu.id.toString() === userTwoWaifuId), 1));

					userOneDatabaseProfile.save();
					userTwoDatabaseProfile.save();

					// Récupération de l'embed de succès pour remplacer l'embed d'origine
					const { embeds } = customEmbeds.tradeSuccess(
						[
							{ userId: userOneId, waifu: userOneAnilistWaifu },
							{ userId: userTwoId, waifu: userTwoAnilistWaifu },
						],
						imageName
					);
					interaction.editReply({ embeds, components: [] });
				} else if (i.customId === 'decline') {
					console.log("Echange refusé");
					embeds[0].setTitle("Trade was declined.").setColor(0xff0000);
					interaction.editReply({ embeds, files, components: [] });
				} else {
					console.log("Echange annulé");
				}
				// If there is an error, log it and cancel the trade
				// If the user doesn't answer in time, cancel the trade
			}).catch((err) => {
				embeds[0].setTitle("Trade was canceled.").setColor(0xff6600);
				interaction.editReply({ embeds, files, components: [] });
				console.log(err);
			}).then(() => {
				rmSync(imageName);
			});

		});
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
