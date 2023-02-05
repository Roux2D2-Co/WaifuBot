import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction, ChannelType } from "discord.js";
import Anilist, { AnilistWaifu } from "../../../classes/Anilist";
import { UserModel } from "../../../database/models/user";
import customEmbeds from "../../../utils/customEmbeds";
import { convertImageToShiny } from "../../../utils/shinyImage";

let timeMap = new Map<string, number>();
let nextWaifu: AnilistWaifu | null = null;
let nextShiny = false;

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
			if (timeMap.get(interaction.guild!.id) && timeMap.get(interaction.guild!.id)! > Date.now()) {
				await interaction.editReply("Il faut attendre 20 secondes entre chaque waifu");
				return;
			}
			const randomWaifu = nextWaifu ?? await Anilist.getRandomCharacter();
			let shiny = nextShiny;
			console.log("Nouvelle interaction !" + (shiny ? " (shiny)" : ""));
			interaction.guild!.waifu = randomWaifu;
			// --- Shiny ---
			// TODO : 
			// Gérer la suppression des anciennes images lorsqu'un nouveau drop est fait
			// Gérer l'enregistrement d'un shiny dans la base de données (ajouter un champ "shiny" à la waifu)
			if (Math.random() < 0.5) {
				console.log("Prochain drop shiny !");
				console.log("Génération de l'image shiny en cours...");
				new Promise<void>(async (resolve, reject) => {
					nextWaifu = await Anilist.getRandomCharacter();
					nextShiny = true;
					convertImageToShiny(nextWaifu.id).then(() => {
						console.log("Image shiny générée ! Prochain personnage : " + nextWaifu?.name.full);
						resolve();
					});
				});
			} else {
				nextShiny = false;
				nextWaifu = null;
				console.log("Prochain drop non shiny");
			}
			
			const { embeds, files } = await customEmbeds.randomWaifu(randomWaifu, shiny);
			interaction.guild?.channels.fetch(interaction.channelId).then((c) => {
				console.log("Nouveau message !" + (shiny ? " (shiny)" : ""));
				if (!c || c.type != ChannelType.GuildText) return;
				c.send({ embeds, files }).then((m) => (interaction.guild!.waifuMessage = m));
				interaction.deleteReply();
				console.log(randomWaifu.name);
				timeMap.set(interaction.guild!.id, Date.now() + 20000);
			});
		}
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
