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
	const fittedImage = resizeToFit(image);
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
	const frameImage = new Jimp(STANDARD_DIMENSIONS.width, STANDARD_DIMENSIONS.height);
	frameImage.bitmap.data = frame.bitmap.data;
	const maskImage = frameImage.clone();
	const backgroundImage = overlayImage.clone();
	maskImage.mask(backgroundImage.clone(), 0, 0);

	const mergedImage = await backgroundImage.composite(maskImage, 0, 0, {
		mode: Jimp.BLEND_DESTINATION_OVER,
		opacityDest: 0.63,
		opacitySource: 1,
	});

	const mergedFrame = new BitmapImage(mergedImage.bitmap);
	GifUtil.quantizeDekker(mergedFrame, 256);
	return new GifFrame(mergedFrame);
};

const resizeToFit = (image: Jimp): Jimp => {
	if (image.getHeight() != STANDARD_DIMENSIONS.height || image.getWidth() != STANDARD_DIMENSIONS.width) {
		//transform image to fit gif dimensions
		const newImage = new Jimp(STANDARD_DIMENSIONS.width, STANDARD_DIMENSIONS.height);
		//add image to new image centered vertically
		const x = (STANDARD_DIMENSIONS.width - image.bitmap.width) / 2;
		const y = (STANDARD_DIMENSIONS.height - image.bitmap.height) / 2;
		newImage.composite(image, x, y);
		return newImage;
	} else {
		return image;
	}
};
