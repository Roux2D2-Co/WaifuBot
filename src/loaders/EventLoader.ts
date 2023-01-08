import { resolve } from "path";
import { readdirSync, existsSync } from "fs";
import { client } from "../index";

export class EventLoader {
	public static async loadEvents(): Promise<void> {
		let eventFolder = resolve(__dirname, "../events");
		if(!existsSync(eventFolder)) throw new Error("Events folder not found !");
		const files = readdirSync(eventFolder).filter((file) => file.endsWith(".js"));
		for await (const file of files) {
			const { default: event } = await import(resolve(__dirname, "../events", file));
			client.on(file.split(".")[0], event.bind(null, client));
		}
	}
}
