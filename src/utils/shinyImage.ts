import Jimp from "jimp";
import { BitmapImage, GifFrame, GifUtil } from "gifwrap";

const STANDARD_DIMENSIONS = { width: 128, height: 213 };

const gifPath = "./assets/images/shiny.gif";

export async function convertImageToShiny(waifuId: number) {
	const imagePath = `./assets/images/${waifuId}.png`;
	const outputPath = imagePath.replace(".png", "-shiny.gif");
	return await main(imagePath, outputPath);
}

async function main(imagePath: string, outputPath: string): Promise<void> {
	const gif = await GifUtil.read(gifPath);
	const image = await Jimp.read(imagePath);
	const fittedImage = transformImage(image);
	const frames = await Promise.all(
		gif.frames.map(async (frame) => {
			const mergedFrame = await mergeImages(frame, fittedImage);
			const gifFrame = new GifFrame(mergedFrame.bitmap.width, mergedFrame.bitmap.height, mergedFrame.bitmap.data);
			gifFrame.xOffset = frame.xOffset;
			gifFrame.yOffset = frame.yOffset;
			gifFrame.disposalMethod = frame.disposalMethod;
			gifFrame.delayCentisecs = frame.delayCentisecs;
			return gifFrame;
		})
	);
	await GifUtil.write(outputPath, frames);
}

const mergeImages = async (frame: BitmapImage, overlayImage: Jimp) => {
	const frameImage = new Jimp(frame.bitmap.width, frame.bitmap.height);
	frameImage.bitmap.data = frame.bitmap.data;

	const mergedImage = await frameImage.composite(overlayImage, 0, 0, {
		mode: Jimp.BLEND_SCREEN,
		opacityDest: 0.8,
		opacitySource: 1,
	});

	const mergedFrame = new BitmapImage(mergedImage.bitmap);
	GifUtil.quantizeDekker(mergedFrame, 256);
	return new GifFrame(mergedFrame);
};

const transformImage = (image: Jimp): Jimp => {
	//transform image to fit gif dimensions
	const newImage = new Jimp(STANDARD_DIMENSIONS.width, STANDARD_DIMENSIONS.height);

	//add image to new image centered vertically
	const x = (STANDARD_DIMENSIONS.width - image.bitmap.width) / 2;
	const y = (STANDARD_DIMENSIONS.height - image.bitmap.height) / 2;
	newImage.composite(image, x, y);
	return newImage;
};
