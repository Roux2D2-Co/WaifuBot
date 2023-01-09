import { ButtonInteraction, ButtonStyle, ComponentType, InteractionButtonComponentData, ModalSubmitInteraction } from "discord.js";

/**
 * Les interactions présentes dans le dossier "Components" sont automatiquement
 * importées (les sous-dossiers ne sont là que pour le rangement)
 *
 * Un composant a plusieurs propriétés qui sont déclarées par discord.js et le fichier customComponents.d.ts
 *
 * Un composant doit être exportée par défaut et contenir un certain nombre de propriétés
 *
 * Un composant doit absolument envoyer une réponse à l'interaction de l'utilisateur,
 * On réalise cela en utiliser le paramètre "interaction"
 * On peut utiliser
 * 									- "interaction.reply" pour envoyer une réponse immédiate
 * 									- "interaction.update" pour modifier le message où est attaché le bouton
 * 									- "interaction.deferReply" pour faire patienter l'utilisateur avant la réponse
 * 									- "interaction.deferUpdate" pour faire patienter l'utilisateur avant la modification du message du bouton
 * 									- "interaction.editReply" pour modifier une réponse (déférer une réponse est vu comme une réponse)
 *
 * Une réponse peut être de deux types différents :
 * 		"ephemeral" (la réponse est visible uniquement par l'utilisateur qui a lancé la commande et éphémère)
 * 		 ou normale (la réponse est visible par tout le monde)
 */

export default {
	customId: "test_button",
	regexValidator: /test_button.+/,
	async execute(interaction: ButtonInteraction): Promise<void> {
		interaction.reply("Salut");
	},
	style: ButtonStyle.Primary,
	type: ComponentType.Button,
	disabled: false,
	emoji: "🤖",
	label: "test",
} as InteractionButtonComponentData;
