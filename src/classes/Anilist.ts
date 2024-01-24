import axios, { AxiosResponseTransformer } from "axios";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { randomInt } from "../utils/utils";
import { ObtentionWay } from "./ObtentionWay";
import { Waifu } from "./Waifu";
import { AnilistWaifu } from "./AnilistWaifu";

const query = readFileSync("./utils/randomAnilistCharacter.gql", "utf-8");
const getWaifuByIdQuery = readFileSync("./utils/getAnilistCharacterById.gql", "utf-8");
const responseTransformer: AxiosResponseTransformer = (data,_, status): AnilistWaifu => {
	return JSON.parse(data).data.Page.characters[0];
};

export default class Anilist {
	static __API_URL = "https://graphql.anilist.co";
	static async getRandomCharacter(not_in: number[] = []): Promise<AnilistWaifu> {
		let { data: waifu } = await axios.post(
			this.__API_URL,
			{ query, variables: { pageNumber: randomInt(129169), not_in } },
			{ transformResponse: responseTransformer }
		);

		//download waifu image
		const { data: image } = await axios.get(waifu.image.large, { responseType: "arraybuffer" });
		//save waifu image
		await writeFileSync(`./assets/images/${waifu.id}.png`, image);
		return waifu;
	}

	static async getWaifuById(id: number | string): Promise<AnilistWaifu> {
		isNaN(id as number) && (id = parseInt(id as string));
		let { data: waifu } = await axios.post(
			this.__API_URL,
			{ query: getWaifuByIdQuery, variables: { id } },
			{
				transformResponse: (r) => {
					return JSON.parse(r).data.Character;
				},
			}
		);
		//download waifu image
		if (!existsSync(`./assets/images/${waifu.id}.png`)) {
			const { data: image } = await axios.get(waifu.image.large, { responseType: "arraybuffer" });
			//save waifu image
			await writeFileSync(`./assets/images/${waifu.id}.png`, image);
		}
		return waifu;
	}

	static transformer: { [key: string]: Function } = {
		toDatabaseWaifu: (anilistWaifu: AnilistWaifu, obtentionWay?: ObtentionWay): Waifu => {
			return {
				id: anilistWaifu.id,
				name: anilistWaifu.name.full,
				image: anilistWaifu.image.large,
				date: new Date(),
				type: obtentionWay ?? ObtentionWay.other,
				media: anilistWaifu.media.edges[0].node,
			};
		},
	};
}
