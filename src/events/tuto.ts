import { Client, Message } from "discord.js";

/**
 * Les évènements présent dans ce dossier sont automatiquement importés
 * dans le bot selon le nom du fichier.
 * La syntaxe est importante
 *
 * La liste des évènements disponibles est disponible ici
 * @link https://discord.js.org/#/docs/discord.js/main/class/Client
 *
 * Chaque fichier d'évènement doit exporter par défaut une fonction (potentiellement asynchrone)
 * et qui prend en paramètre les paramètres indiqués sur la documentation
 *
 * Exemple :
 * L'event "messageCreate" est déclenché lorsque le bot reçoit un message
 * Il prend en paramètre le message qui est de type Message, exporté par discord.js
 */

export default async (message: Message) => {
	console.log(`Message reçu : ${message.content}`);
};
