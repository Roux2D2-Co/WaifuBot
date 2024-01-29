import { If } from "../utils/if";
import { Waifu } from "./Waifu";

type WaifuName = {
	alternative: string[];
	alternativeSpoiler: string[];
	userPreferred: string;
	full: string;
};

type WaifuImage = {
	large: string;
};

type MediaNode = Array<{
	title: {
		romaji: string;
	};
	isAdult: boolean;
}>;

type MediaTitle = {
	userPreferred: string;
	romaji: string;
	english: string;
};

type MediaEdge = {
	node: WaifuMedia;
};

type WaifuMedia = {
	id: int;
	title: MediaTitle;
	isAdult: boolean;
};

type WaifuMediaEdges = { edges: Array<MediaEdge> };

type AnilistWaifu = {
	id: number;
	age: string;
	siteUrl: string;
	image: WaifuImage;
	name: WaifuName;
	gender: string;
	media: WaifuMediaEdges;
};

type AnilistWaifuMediaImport = Pick<Waifu, "media" | "id" | "isAdult">;

type AnilistWaifuImportQueryResponse = {
	data: {
		[key: string]: {
			characters: Array<AnilistWaifu>;
		};
	};
};
