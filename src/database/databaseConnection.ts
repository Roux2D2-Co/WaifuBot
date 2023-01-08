import { Collection } from "mongodb";
import mongoose from "mongoose";

async function init() {
	await mongoose.connect(process.env?.MONGODB_URI ?? "mongodb://127.0.0.1:27017");
	console.log("db connectée");
}

export { init };
