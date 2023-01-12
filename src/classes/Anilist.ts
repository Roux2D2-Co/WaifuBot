import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { randomInt } from "../utils/utils";
import { AnilistWaifu } from "./AnilistWaifu";

const query = readFileSync("./utils/randomAnilistCharacter.gql", "utf-8");
const responseTransformer = (response: any): AnilistWaifu => {
	return JSON.parse(response).data.Page.characters[0];
};

export default class Anilist {
	static __API_URL = "https://graphql.anilist.co";
	static async getRandomCharacter(): Promise<AnilistWaifu> {
		let { data: waifu } = await axios.post(
			this.__API_URL,
			{ query, variables: { pageNumber: randomInt(129169), not_in: [1] } },
			{ transformResponse: responseTransformer }
		);

		//download waifu image
		const { data: image } = await axios.get(waifu.image.large, { responseType: "arraybuffer" });
		//save waifu image
		await writeFileSync(`./assets/images/${waifu.id}.png`, image);
		return waifu;
	}
}

export { AnilistWaifu };
