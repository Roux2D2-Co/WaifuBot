import { Schema } from "mongoose";
import { ObtentionWay } from "./ObtentionWay";

export interface Waifu {
	date: Date;
	name: string;
	image: string;
	media?: {
		id: string;
		title: {
			romaji: string;
			english: string;
		};
	};
	type: ObtentionWay;
	id: number;
}

export const WaifuSchema = new Schema({
	date: {
		type: Date,
		required: true,
		default: Date.now,
	},
	name: {
		type: String,
		required: true,
	},
	image: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: false,
		enum: ObtentionWay,
		default: ObtentionWay.other,
	},
	media: {
		id: {
			type: String,
			required : false,
		},
		title: {
			romaji: {
				type: String,
				required: false,
			},
			english: {
				type: String,
				required: false,
			},
		},
	},
	id: {
		type: Number,
		required: true,
		index: true,
	},
});