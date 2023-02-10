import { ChatInputApplicationCommandData, ApplicationCommandType, ChatInputCommandInteraction } from "discord.js";
import { CustomEmotes } from "../../../utils/customEmotes";

/**
 * Les commandes présentes dans le dossier "Commands" sont automatiquement
 * importées (les sous-dossiers ne sont là que pour le rangement)
 *
 * Une commande a plusieurs propriétés qui sont déclarées par discord.js et le fichier customComponents.d.ts
 *
 * Une commande doit être exportée par défaut et contenir un certain nombre de propriétés
 *
 * Une commande doit absolument envoyer une réponse à l'interaction de l'utilisateur,
 * On réalise cela en utiliser le paramètre "interaction"
 * On peut utiliser
 * 									- "interaction.reply" pour envoyer une réponse immédiate
 * 									- "interaction.deferReply" pour faire patienter l'utilisateur avant la réponse
 * 									- "interaction.editReply" pour modifier une réponse (déférer une réponse est vu comme une réponse)
 *
 * Une réponse peut être de deux types différents :
 * 		"ephemeral" (la réponse est visible uniquement par l'utilisateur qui a lancé la commande et éphémère)
 * 		 ou normale (la réponse est visible par tout le monde)
 */

export default {
	dmPermission: false, //est-ce que la commande est disponible en message privée ?
	description: "Salut c'est la commande de test",
	name: "test",
	guilds: ["780715935593005088"], //les serveurs où la commande est déployée

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.deferred || interaction.replied) {
			interaction.editReply({ content: `${CustomEmotes.loading} ${interaction.client.user.username} réfléchit...` });
		}
		await interaction.deferReply({ ephemeral: true });
		// do something

		await interaction.editReply({ content: "Le contenu de mon message" });
	},
	type: ApplicationCommandType.ChatInput,
} as ChatInputApplicationCommandData;
