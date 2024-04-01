import {
	CacheType,
	ModalComponentData,
	APIActionRowComponent,
	APITextInputComponent,
	ActionRowData,
	JSONEncodable,
	ModalActionRowComponentData,
	ModalSubmitInteraction,
	ModalBuilder,
	AwaitModalSubmitOptions,
	MessageComponentInteraction,
} from "discord.js";

export default class CustomModal implements ModalComponentData {
	title: string;
	components: (JSONEncodable<APIActionRowComponent<APITextInputComponent>> | ActionRowData<ModalActionRowComponentData>)[];
	execute?: ((interaction: ModalSubmitInteraction<CacheType>, ...args: any[]) => Promise<any>) | undefined;
	regexValidator?: RegExp | undefined;
	customId: string;

	build = () => {
		return new ModalBuilder(this);
	};

	constructor(data: ModalComponentData) {
		this.title = data.title;
		this.components = data.components;
		this.execute = data.execute;
		this.regexValidator = data.regexValidator;
		this.customId = data.customId;
	}

	async showModalAndWaitForResult(
		interaction: MessageComponentInteraction<CacheType>,
		options: AwaitModalSubmitOptions<ModalSubmitInteraction>
	): Promise<any> {
		if (!this.execute) throw Error("CustomModal need an execute function to be used in showModalAndWaitForResult");
		if (!options.filter) {
			options.filter = (i) => i.user.id === interaction.user.id;
		}
		interaction.showModal(this.build());
		let modalSubmitInteraction = await interaction.awaitModalSubmit(options);
		return await this.execute(modalSubmitInteraction);
	}
}
