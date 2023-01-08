Array.prototype.randomValue = function () {
	return this[Math.floor(Math.random() * this.length)];
};
