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

type MediaEdge<FromAnilist> = {
	node: WaifuMedia<FromAnilist>;
};

type WaifuMedia<FromAnilist extends boolean = false> = {
	id: int;
	title: If<FromAnilist, MediaTitle, string>;
	isAdult: boolean;
};

type WaifuMediaNodes = Array<WaifuMedia<true>>;

type WaifuMediaEdges<FromAnilist> = Array<MediaEdge<FromAnilist>>;

type AnilistWaifu<FromAnilist extends boolean = false> = {
	id: number;
	age: string;
	siteUrl: string;
	image: WaifuImage;
	name: WaifuName;
	gender: string;
	media: If<FromAnilist, { edges: WaifuMediaEdges<FromAnilist> }, { nodes: WaifuMediaNodes }>;
};

type AnilistWaifuMediaImport = Pick<Waifu<true>, "media" | "id" | "isAdult">;

type AnilistWaifuImportQueryResponse = {
	data: {
		[key: string]: {
			characters: Array<AnilistWaifu<true>>;
		};
	};
};
