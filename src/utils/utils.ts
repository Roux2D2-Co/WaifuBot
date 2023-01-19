const colorThief = require("colorthief");
import axios from "axios";
import { writeFileSync, rmSync } from "fs";
import { User } from "../database/models/user";

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

export async function returnDominantColor(image: string) {
	let color: Array<number>;
	//check if image is something else than a png
	if (image.includes(".png")) {
	color = await colorThief.getColor(image);
	} else {
		color = [255, 255, 255]
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



export async function getAllMediasForAllWaifus(userProfile: User): Promise<boolean> {
	let nbPages = Math.ceil(userProfile.waifus.length / 50);
	let request = `query allMedias($in : [Int]) {`;
	for (let i = 1; i < nbPages + 1; i++) {
		request += `a_${i}: Page(perPage: 50, page: ${i}) {
			characters(sort: ID, id_in: $in) {
				id
				media(perPage: 50, sort: ID) {
					nodes {
						id
						source
						title {
							romaji
							english
						}
					}
				}
			}
		}`
	}
	request += `}`;
	return axios.post("https://graphql.anilist.co", {
		query: request,
		variables: {
			in: userProfile.waifus.map(w => w.id)
		}
	}).then(res => {
		let i = 1;
		userProfile.waifus.forEach(w => {
			let media = res.data.data[`a_${Math.ceil(i / 50)}`].characters.find((c:any) => c.id == w.id).media.nodes.filter((m:any) => m.source == "ORIGINAL")[0];
			if (media == undefined) {
				media = res.data.data[`a_${Math.ceil(i / 50)}`].characters.find((c:any) => c.id == w.id).media.nodes[0];
			}
			i++;
			if (media != undefined) {
				w.media = {
					id: media.id,
					title: {
						romaji: media.title.romaji,
						english: media.title.english
					}
				};
			}
		})
		return true;
	}).catch(err => {
		console.error(err);
		return false;
	})
}