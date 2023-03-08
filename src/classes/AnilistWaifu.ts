export interface AnilistWaifu {
	id: number;
	age: string;
	siteUrl: string;
	image: {
		large: string;
	};
	name: {
		alternative: string[];
		alternativeSpoiler: string[];
		userPreferred: string;
		full: string;
	};
	gender: string;
	media: {
		nodes: Array<{
			title: {
				romaji: string;
			};
			isAdult: boolean;
		}>;
	};
}
