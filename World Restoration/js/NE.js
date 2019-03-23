function gainedKeys() {
	return game.forks.divide(1e3).pow(2/3).multiply(getKeyMultiplier());
}

function getKeyMultiplier() {
	if(game.brake) return new Decimal(1)
	return game.keyMultiplier
}

function newEpisode() {
	if(gainedKeys().lt(1)) return;
	game.newEpisode = game.newEpisode.add(1);
	game.keys = game.keys.add(gainedKeys());
	reset(1);
}

game.neUpgradeCosts = {0: "5", 1: "50", 2: "500"}
for(i in game.neUpgradeCosts) game.neUpgradeCosts[i] = new Decimal(game.neUpgradeCosts[i]);

function buyNEUpgrade(u) {
	if(game.neUpgrades.includes(u)) return;
	if(game.keys.lt(game.neUpgradeCosts[u])) return;
	game.neUpgrades.push(u)
	game.keys = game.keys.subtract(game.neUpgradeCosts[u]);
}

function getNEUpgradeEffect(u) {
	switch(u) {
		case 0:
			return game.keys.add(1).log10().add(1).pow(3)
		case 1:
			return Decimal.pow(1.1, game.totalFRBought.divide(10))
		case 2:
			return game.newEpisode.pow(0.75)
	}
}

function buyKeyMultiplier() {
	if(game.brake) return;
	if(game.keys.lt(game.keyMultiplierCost)) return;
	game.keys = game.keys.subtract(game.keyMultiplierCost);
	game.keyMultiplier = game.keyMultiplier.multiply(1.05);
	game.keyMultiplierCost = game.keyMultiplierCost.multiply(1.08);
}
