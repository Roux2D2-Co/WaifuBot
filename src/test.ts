function getObfuscatedWaifuName(words: string): string {
	let letters: string[] = [];
	let splitters: string[] = [];
	let regex = /[^a-zA-Z-0-9]|[-](?=[a-zA-Z0-9])/gim;
	words.split(regex).forEach((word) => {
		console.log(word);
		letters.push(/\b(.{1}).*? ?\b/gim.exec(word)![1]);
	});

  splitters = words.match(regex)!;

	let finalStr = "";
  console.log(letters, splitters)
	for (let i = 0; i < letters.length; i++) {
		finalStr += letters[i];
		if (!!splitters[i]) {
			finalStr += splitters[i];
		}
		console.log(finalStr);
	}

	return finalStr;
}
