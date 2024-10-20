import {
	BaseComponentData,
	BaseInteraction,
	ButtonBuilder,
	ButtonInteraction,
	CacheType,
	Guild,
	User,
} from "discord.js";
import CustomButton from "./CustomButton";
import { AnilistWaifu } from "./AnilistWaifu";

export type MemberHintData = {
	knownName: string;
	usedHints: { [key: typeof CustomButton.prototype.customId]: number };
};

export type WaifuHintData = {
	trueName: string;
	userMap: {
		[key: typeof User.prototype.id]: MemberHintData;
	};
};

type MemberWaifuHintData = Pick<WaifuHintData, "trueName"> & MemberHintData;

export type GuildHintData = Map<number, WaifuHintData>;

export class HintCacheManager {
	cache: Map<typeof Guild.prototype.id, GuildHintData> = new Map();

	getGuild = (guildId: typeof Guild.prototype.id) => {
		if (!this.cache.has(guildId)) {
			this.cache.set(guildId, this.getDefaultGuildData());
		}
		return this.cache.get(guildId)!;
	};

	getGuildWaifu = (guildId: typeof Guild.prototype.id, waifuId: AnilistWaifu["id"]) => {
		return this.getGuild(guildId)?.get(waifuId);
	};

	setGuildWaifu = (guildId: typeof Guild.prototype.id, waifu: AnilistWaifu) => {
		let guild = this.getGuild(guildId);
		let waifuData = this.getDefaultWaifuData(waifu.name.full);
		guild.set(waifu.id, waifuData);
	};

	getGuildMember = (guildId: typeof Guild.prototype.id, waifuId: AnilistWaifu["id"], memberId: typeof User.prototype.id): MemberWaifuHintData => {
		let waifu = this.getGuildWaifu(guildId, waifuId);
		if (!waifu) throw new Error(`Not able to find waifu ${waifuId} on guild ${guildId}`);

		let user: MemberWaifuHintData = (waifu?.userMap[memberId] as MemberWaifuHintData) || this.getDefaultMemberData(waifu.trueName);

		user.trueName ||= waifu.trueName;

		return user;
	};

	setGuildMember = (
		guildId: typeof Guild.prototype.id,
		waifu: AnilistWaifu,
		memberId: typeof User.prototype.id,
		userData: MemberHintData = this.getDefaultMemberData(waifu.name.full)
	) => {
		let guildWaifu = this.getGuildWaifu(guildId, waifu.id);
		if (!guildWaifu) throw new Error(`Waifu ${waifu.id} does not exists on guild ${guildId}`);
		guildWaifu.userMap[memberId] = userData;
	};

	private getDefaultGuildData = (): GuildHintData => new Map();

	private getDefaultWaifuData = (waifuName: string): WaifuHintData => {
		return {
			trueName: waifuName,
			userMap: {},
		};
	};

	private getDefaultMemberData = (waifuName: string): MemberHintData => {
		console.debug(waifuName);
		return {
			knownName: waifuName.replace(/\S/g, "*"),
			usedHints: {},
		};
	};
}

export interface InteractionHintButtonComponentData extends Omit<BaseComponentData, "execute"> {
	//InteractionHintButtonComponentData is defined with references to CustomButton which extends BaseButtonComponentData so it should be update proof
	type: typeof CustomButton.prototype.type;
	disabled?: (buttonData: HintButton, memberHintData: MemberHintData) => typeof CustomButton.prototype.disabled;
	emoji?: (buttonData: HintButton, memberHintData: MemberHintData) => typeof CustomButton.prototype.emoji;
	label: typeof CustomButton.prototype.label;
	style: (buttonData: HintButton, memberHintData: MemberHintData) => typeof CustomButton.prototype.style;
	customId: typeof CustomButton.prototype.customId;

	/**
	 * Process hint button click and return updated MemberHintData to main process to respond to the itneraction
	 * @param interaction			Interaction
	 * @param memberHintData 	Member data containing knownName, trueName and used hints count
	 * @param args
	 * @returns MemberHintData (new value)
	 */
	execute: (interaction: ButtonInteraction, memberHintData: MemberWaifuHintData, ...args: any[]) => Promise<MemberHintData>;
}

type ReturnTypeMap<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : T[K];
};

type HintButtonToCustomButtonMap = ReturnTypeMap<Omit<HintButton, "build" | "execute">>;
const BANNED_FUNCTIONS = ["build", "execute"];

export class HintButton implements InteractionHintButtonComponentData {
	disabled: (buttonData: HintButton, memberHintData: MemberHintData) => typeof CustomButton.prototype.disabled;
	emoji: (buttonData: HintButton, memberHintData: MemberHintData) => typeof CustomButton.prototype.emoji;
	label: typeof CustomButton.prototype.label;
	style: (buttonData: HintButton, memberHintData: MemberHintData) => typeof CustomButton.prototype.style;
	customId: typeof CustomButton.prototype.customId;
	execute: (interaction: ButtonInteraction<CacheType>, memberHintData: MemberWaifuHintData, ...args: any[]) => Promise<any>;
	type: typeof CustomButton.prototype.type;
	regexValidator?: RegExp | undefined;

	build = (memberHintData?: MemberWaifuHintData) => {
		if (!memberHintData) throw Error("HintButton requires memberHintData to be built");
		let toCustomButtonMap: Partial<HintButtonToCustomButtonMap> = {};

		for (const key of Object.keys(this)) {
			if (BANNED_FUNCTIONS.includes(key)) continue;
			if (typeof this[key as keyof this] == "function") {
				let func = this[key as keyof this] as (...args: any[]) => any;
				toCustomButtonMap[key as keyof HintButtonToCustomButtonMap] = func(this, memberHintData);
			} else {
				toCustomButtonMap[key as keyof HintButtonToCustomButtonMap] = this[key as keyof this] as any;
			}
		}
		return new ButtonBuilder(toCustomButtonMap);
	};

	constructor(data: InteractionHintButtonComponentData) {
		this.style = data.style;
		this.customId = `showHint-${data.customId}`;
		this.disabled = data.disabled ?? ((buttonData, memberHintData) => !!memberHintData.usedHints[buttonData.customId]);
		this.emoji = data.emoji = () => undefined;
		this.label = data.label;
		this.type = data.type;
		this.regexValidator = data.regexValidator && data.regexValidator;
		this.execute = data.execute ?? ((interaction: ButtonInteraction, ...args) => interaction.reply("You pressed the button"));
	}
}
