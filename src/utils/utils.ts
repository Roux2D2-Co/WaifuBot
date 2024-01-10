import { AutocompleteInteraction } from "discord.js";
import { UserModel, User } from "../database/models/user";

const colorThief = require("colorthief");
import axios, { AxiosResponse } from "axios";
import { AnilistWaifuImportQueryResponse, MediaEdge } from "../classes/AnilistWaifu";

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
	return keys.reduce((o, k) => ((o[k] = obj[k]), o), {} as Pick<T, K>);
}

export function randomString(len = 25): string {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < len; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

//random integer between up to bound
export function randomInt(max: number) {
	max = Math.floor(max);
	return Math.floor(Math.random() * max); // The maximum is exclusive and the minimum is inclusive
}

export async function autocompleteCharacter(interaction: AutocompleteInteraction) {
	let nameMatchingRegex = /character/;
	let focusedOption = interaction.options.getFocused(true);
	let regexResult = nameMatchingRegex.exec(focusedOption.name);
	let targetId = interaction.user.id;
	if (!!regexResult) {
		let subCommandGroupName = interaction.options.getSubcommandGroup(false);
		let subCommandName = interaction.options.getSubcommand(false);
		let subCommandGroup = interaction.options.data.find((option) => option.name === subCommandGroupName);
		let subCommand = (subCommandGroup?.options || interaction.options.data)?.find((option) => option.name === subCommandName);

		let targetOption = subCommand?.options?.find((option) => option.name == "target");
		if (!!targetOption) {
			targetId = targetOption.value as string;
		}
		let profile = await UserModel.findOne({ id: targetId });
		if (!profile || profile.waifus.length === 0) {
			return interaction.respond([
				{
					name: `${targetId === interaction.user.id ? "You don't have a profile" : "This user doesn't have a profile"}`,
					value: "",
				},
			]);
		}
		let mappedWaifus = profile.waifus
			.map((waifu) => {
				return {
					name: waifu.name,
					value: waifu.id.toString(),
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name))
			.filter((w) => w.name.toLowerCase().includes(focusedOption.value.toLowerCase() || ""))
			.slice(0, 25);
		interaction.respond(mappedWaifus);
	} else {
		interaction.respond([]);
	}
}

export async function returnDominantColor(image: string) {
	let color: Array<number>;
	//check if image is something else than a png
	if (image.includes(".png")) {
		color = await colorThief.getColor(image);
	} else {
		color = [255, 255, 255];
	}
	return color;
}

export function componentToHex(c: number) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 *
 * @param group Array to split into chunks
 * @param size  Size of the chunks
 * @param length Max number of chunks to return (default: Infinity)
 * @returns Array of chunks
 */
export function groupArray<T>(group: Array<T>, size: number, length: number = Infinity) {
	return group
		.reduce(
			(accumulator: Array<Array<T>>, current: T, index: number, original: Array<T>) =>
				index % size == 0 ? accumulator.concat([original.slice(index, index + size)]) : accumulator,
			[]
		)
		.filter((single, index) => index < length);
}

const maxWaifuPerPage = 50,
	maxPagePerRequest = 45;
export function getAllMediasForAllWaifus<T extends User>(userProfile: T): Promise<T> {
	return new Promise(async (resolve, reject) => {
		let userWaifus = groupArray(userProfile.waifus, maxWaifuPerPage);
		do {
			let waifuPages = userWaifus.splice(0, maxPagePerRequest);

			let request = `query allMedias($in : [Int]) {`;
			for (let i = 0; i < waifuPages.length; i++) {
				request += `a_${i}: Page(perPage: ${maxWaifuPerPage}, page: ${i}) {
				characters(sort: ID, id_in: $in) {
					id
					media(perPage: 1, sort:[FAVOURITES_DESC, POPULARITY_DESC]) {
						edges {
							node {
								id
								isAdult
								title {
									romaji
									english
								}
							}
					}
				}
			}
		}`;
			}
			request += `}`;
			request = request.replace(/\\\\t/g, " ");
			let res: AxiosResponse<AnilistWaifuImportQueryResponse> = await axios.post("https://graphql.anilist.co", {
				query: request,
				variables: {
					in: waifuPages.flatMap((pages) => pages.map((w) => w.id)),
				},
			});
			const pages = res.data.data;
			for (const page of Object.values(pages)) {
				for (const waifu of page.characters) {
					userProfile.waifus.find((w) => w.id === waifu.id)!.media ||= waifu.media.edges[0]?.node;
				}
			}
		} while (userWaifus.length > 0);
		resolve(userProfile);
	});
}
