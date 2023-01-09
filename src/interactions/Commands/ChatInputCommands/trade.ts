import { createReadStream, createWriteStream, rmSync } from "fs";
import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";
import { UserModel, User } from "../../../database/models/user";
import Anilist from "../../../classes/Anilist";

import * as PImage from "pureimage";
import { Document } from "mongoose";
import { randomInt } from "../../../utils/utils";
import customEmbeds from "../../../utils/customEmbeds";
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
		await interaction.deferReply({ ephemeral: false });
		const userOneId = interaction.user.id;
		const userOneDatabaseProfile = users[userOneId] ?? (await UserModel.findOne({ id: userOneId }));
		if (!userOneDatabaseProfile) {
			await interaction.editReply("Vous n'avez pas de profil enregistré.");
			return;
		}

		const userTwoId = interaction.options.getUser("user")!.id;
		const userTwoDatabaseProfile = users[userTwoId] ?? (await UserModel.findOne({ id: userTwoId }));
		if (!userTwoDatabaseProfile) {
			await interaction.editReply("L'utilisateur avec qui vous souhaitez échanger n'a pas de profil enregistré.");
			return;
		}

		const userOneWaifuId = interaction.options.getString("give")!;
		const userTwoWaifuId = interaction.options.getString("receive")!;

		const userOneWaifu = await Anilist.getWaifuById(userOneWaifuId);
		const userTwoWaifu = await Anilist.getWaifuById(userTwoWaifuId);

		const megaCanvas = PImage.make(charImageDimensions.width * 3, charImageDimensions.height, {});
		const c = megaCanvas.getContext("2d");

		const userOneWaifuImageReadStream = createReadStream(`./assets/images/${userOneWaifu.id}.png`);
		const userOneWaifuImage = await PImage[userOneWaifu.image.large.endsWith("png") ? "decodePNGFromStream" : "decodeJPEGFromStream"](
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

		const userTwoWaifuImageReadStream = createReadStream(`./assets/images/${userTwoWaifu.id}.png`);
		const userTwoWaifuImage = await PImage[userTwoWaifu.image.large.endsWith("png") ? "decodePNGFromStream" : "decodeJPEGFromStream"](
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
				{ userId: userOneId, waifu: userOneWaifu },
				{ userId: userTwoId, waifu: userTwoWaifu },
			],
			imageName
		);

		await interaction.editReply({ embeds, files }).then(() => {
			rmSync(imageName);
		});
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
