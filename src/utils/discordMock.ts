import { ChatInputCommandInteraction, Client, APIInteraction, CacheType, CommandInteractionOption, DiscordjsError } from "discord.js";

export class MockedInteraction extends ChatInputCommandInteraction {
	constructor(client: Client, interaction: APIInteraction) {
		if (!client.isReady()) throw new DiscordjsError("Client is not ready");
		super(client, interaction);
	}

	static formatInputDataFromParsedInteraction(parsedInteraction: ChatInputCommandInteraction, options: CommandInteractionOption<CacheType>) {
		const interactionJson = parsedInteraction.toJSON() as { [key: string]: any };
		interactionJson.options = options;
		return interactionJson;
	}
}
