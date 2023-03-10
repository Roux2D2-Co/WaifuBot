import mongoose from "mongoose";
import { Waifu, WaifuSchema } from "../../classes/Waifu";

export interface User {
	id: string;
	quote?: string;
	waifus: Waifu[];
	favorite?: Waifu;
	deleteDate?: Date;
	nextRoll: Date;
	tokens: number;
}

export const UserSchema = new mongoose.Schema({
	id: { type: String, unique: true, require: true },
	quote: { type: String, require: false },
	waifus: {
		type: Array<Waifu>(),
		require: true,
		default: [],
	},
	favorite: {
		type: WaifuSchema,
		require: false,
	},
	nextRoll: {
		type: Date,
		require: false,
	},
	deleteDate: { type: Date, require: false },
	tokens: { type: Number, require: true, default: 0 },
});

UserSchema.pre("validate", { document: true }, function (next) {
	if (this.favorite) {
		if (!this.favorite.id || !this.favorite.name || !this.favorite.image || !this.favorite.type || !this.favorite.date) {
			this.favorite = undefined;
		}
	}
	next();
});

export const UserModel = mongoose.model<User>("user", UserSchema);
