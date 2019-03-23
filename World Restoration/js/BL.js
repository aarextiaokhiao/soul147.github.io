// This is getting to be a thing, isn't it?

function ge(e) {
	return document.getElementById(e);
}

// Automatically fill all of that class

function gc(e, f) {
	l = document.getElementsByClassName(e);
	for(var i = 0; i < l.length; i++) {
		f(l[i]);
	}
}

// Tab switching

var currenttab = ""
function tab(t) {
	// Prevent lag.
	if (currenttab == t) return
	
	// Hide the last-selected tab and show the selected tab.
	ge(currenttab).style.display = "none"
	ge(t).style.display = ""
	currenttab = t
}

// The game. Fairly simple.

game = {
	lastUpdate: Date.now(),
	options: {
		notation: "Mixed scientific"
	},
}

// This function is used a lot.

function reset(layers) {
	if(layers > 0) {
		game.forks = new Decimal(10);
		game.totalFRBought = new Decimal(0);
		for(var i = 1; i <= 80; i++) {
			j = i - 1;
			game["fr" + i] = {
				amount: new Decimal(0),
				mult: new Decimal(1.2**j),
				buyMult: new Decimal(1.1),
				cost: new Decimal(10*1.7**j),
				costMult: new Decimal(1.5),
			}
		}
	}
	ge("NCa").style.display = ""
	if(layers > 1) {
		game.keys = new Decimal(0);
		game.neUpgrades = [];
		game.keyMultiplier = new Decimal(1);
		game.keyMultiplierCost = new Decimal(1000);
	}
	if(layers > 2) {
		game.cakes = new Decimal(0);
		game.empoweredCakes = new Decimal(0);
		game.ncaUpgrades = [];
		game.cakeMultiplier = new Decimal(1);
		game.cakeMultiplierCost = new Decimal(1000);
		game.cakeMultiplier2 = new Decimal(1);
		game.cakeMultiplier2Cost = new Decimal(1e6);
		game.brake = false;
	}
	if(layers == Infinity) {
		game.newEpisode = new Decimal(0);
		game.newCakeAtStake = new Decimal(0);
		ge("NCa").style.display = "none"
	}
}

function getUnlockedFR() {
	u = 1;
	
	if(game.newEpisode.gt(0)) u *= 4;
	if(game.newCakeAtStake.gt(0)) u += 4;
	
	return u;
}

function buyFR(n) {
	fr = game["fr" + n];
	if(game.forks.lt(fr.cost)) return;
	// game.forks = game.forks.subtract(fr.cost); // COMMUNISM
	fr.amount = fr.amount.add(1)
	game.totalFRBought = game.totalFRBought.add(1)
	fr.mult = fr.mult.multiply(fr.buyMult)
	fr.cost = fr.cost.multiply(fr.costMult)
	return true;
}

function buyMaxAll() {
	for(var i = 1; i <= getUnlockedFR(); i++) while(buyFR(i));
}

function save() {
	localStorage.wr = btoa(JSON.stringify(game))
}

function load() {
	if(!localStorage.wr) return;
	game = JSON.parse(atob(localStorage.wr))
	
	transformToDecimal(game)
	ge("NCa").style.display = game.newEpisode.gt(0) ? "" : "none"
}

function transformToDecimal(object) { // It's so much better than hevi's version, because it's recursive and I'm a lazy piece of shit
	for(i in object) {
		if(typeof(object[i]) == "string" && !isNaN(new Decimal(object[i]).mag)) object[i] = new Decimal(object[i]); 
		if(typeof(object[i]) == "object") transformToDecimal(object[i]) // iterates over all objects inside the object
	}
}

function update() {
	diff = Date.now() - game.lastUpdate;
	game.lastUpdate = Date.now();
	
	// Hackerman
	
	diff *= parseInt(localStorage.hacker) || 1
	
	for(var i = 1; i <= 80; i++) {
		fr = game["fr" + i]
		fr.production = fr.amount.multiply(fr.mult)
		fr.production = fr.production.multiply(getEmpoweredCakeEffect())
		if(game.neUpgrades.includes(0)) fr.production = fr.production.multiply(getNEUpgradeEffect(0));
		if(game.neUpgrades.includes(1)) fr.production = fr.production.multiply(getNEUpgradeEffect(1));
		if(game.neUpgrades.includes(2)) fr.production = fr.production.multiply(getNEUpgradeEffect(2));
		if(game.ncaUpgrades.includes(0)) fr.production = fr.production.multiply(getNCaUpgradeEffect(0));
		if(game.ncaUpgrades.includes(1)) fr.production = fr.production.multiply(getNCaUpgradeEffect(1));
		game.forks = game.forks.add(fr.production.multiply(diff/1000))
		
		ge("fr"+i+"a").innerHTML = shortenMoney(fr.amount);
		ge("fr"+i+"m").innerHTML = shorten(fr.mult);
		ge("fr"+i+"p").innerHTML = shortenMoney(fr.production);
		ge("fr"+i+"c").innerHTML = shortenMoney(fr.cost);
		ge("fr"+i+"b").style.backgroundColor = game.forks.gte(fr.cost) ? "#0f0" : "#f00"
		
		ge("fr"+i).style.display = (!game["fr" + (i-1)] || game["fr" + (i-1)].amount.gt(0)) && getUnlockedFR() >= i ? "" : "none"
	}
	
	if(game.newEpisode.gt(0)) buyMaxAll();
	if(game.newCakeAtStake.gt(0)) game.keys = game.keys.add(gainedKeys().multiply(diff/1e5))
	
	ge("forks").innerHTML = shortenMoney(game.forks);
	
	ge("newepisodetimes").innerHTML = shortenMoney(game.newEpisode);
	gc("keys", function(n) {n.innerHTML = shortenMoney(game.keys)})
	ge("keygain").innerHTML = shortenMoney(gainedKeys());
	ge("neu1b").style.backgroundColor = game.neUpgrades.includes(0) ? "#0f0" : game.keys.gte(game.neUpgradeCosts[0]) ? "#fff" : "#f00"
	ge("neu1i").innerHTML = shorten(getNEUpgradeEffect(0));
	ge("neu1c").innerHTML = shortenCosts(game.neUpgradeCosts[0]);
	ge("neu2b").style.backgroundColor = game.neUpgrades.includes(1) ? "#0f0" : game.keys.gte(game.neUpgradeCosts[1]) ? "#fff" : "#f00"
	ge("neu2i").innerHTML = shorten(getNEUpgradeEffect(1));
	ge("neu2c").innerHTML = shortenCosts(game.neUpgradeCosts[1]);
	ge("neu3b").style.backgroundColor = game.neUpgrades.includes(2) ? "#0f0" : game.keys.gte(game.neUpgradeCosts[2]) ? "#fff" : "#f00"
	ge("neu3i").innerHTML = shorten(getNEUpgradeEffect(2));
	ge("neu3c").innerHTML = shortenCosts(game.neUpgradeCosts[2]);
	ge("neumb").style.backgroundColor = game.keys.gte(game.keyMultiplierCost) && !game.brake ? "#fff" : "#f00"
	ge("neumi").innerHTML = shorten(getKeyMultiplier());
	ge("neumc").innerHTML = shortenMoney(game.keyMultiplierCost);
	
	ge("newcakeatstaketimes").innerHTML = shortenMoney(game.newCakeAtStake);
	gc("cakes", function(n) {n.innerHTML = shortenMoney(game.cakes)})
	ge("empoweredcaketext").style.display = game.empoweredCakes.eq(0) ? "none" : ""
	ge("exitbrake").style.display = game.brake ? "" : "none"
	ge("empoweredcakes").innerHTML = shortenMoney(game.empoweredCakes);
	ge("cakegain").innerHTML = game.brake ? (gainedCakes().gt(0) ? "Gain " + shortenMoney(gainedCakes()) + " empowered cakes" : "Reach " + shortenMoney(getECReq()) + " keys") : gainedCakes().gt(0) ? "Gain " + shortenMoney(gainedCakes()) + " cakes" : "Reach " + shortenMoney(1e6) + " keys"
	ge("ncau1b").style.backgroundColor = game.ncaUpgrades.includes(0) ? "#0f0" : game.cakes.gte(game.ncaUpgradeCosts[0]) ? "#fff" : "#f00"
	ge("ncau1i").innerHTML = shorten(getNCaUpgradeEffect(0));
	ge("ncau1c").innerHTML = shortenCosts(game.ncaUpgradeCosts[0]);
	ge("ncau2b").style.backgroundColor = game.ncaUpgrades.includes(1) ? "#0f0" : game.cakes.gte(game.ncaUpgradeCosts[1]) ? "#fff" : "#f00"
	ge("ncau2i").innerHTML = shorten(getNCaUpgradeEffect(1));
	ge("ncau2c").innerHTML = shortenCosts(game.neUpgradeCosts[1]);
	ge("ncaumb").style.backgroundColor = game.cakes.gte(game.cakeMultiplierCost) ? "#fff" : "#f00"
	ge("ncaumi").innerHTML = shorten(game.cakeMultiplier);
	ge("ncaumc").innerHTML = shortenMoney(game.cakeMultiplierCost);
	ge("ncaunb").style.backgroundColor = game.cakes.gte(game.cakeMultiplier2Cost) ? "#fff" : "#f00"
	ge("ncauni").innerHTML = shorten(game.cakeMultiplier2);
	ge("ncaunc").innerHTML = shortenMoney(game.cakeMultiplier2Cost);
	ge("empoweredcakeeffect").innerHTML = shorten(getEmpoweredCakeEffect());
	ge("brake").checked = game.brakeNext;
	ge("keymultinc").innerHTML = game.brake ? "0" : "5";
}

function init() {
	// Setup repellent HTML
	HTML = ge("frlist")
	HTML = "<tr>"
	for(var i = 1; i <= 80; i++) {
		if(i % 4 == 1) HTML += "</tr><tr>"
		HTML += '<td id = "fr'+i+'" width = "20%">Fork Repellent '+i+'<br>Amount: <span id = "fr'+i+'a"></span><br>Multiplier: x<span id = "fr'+i+'m"></span><br>Production: <span id = "fr'+i+'p"></span> forks/s<br><button id = "fr'+i+'b" onclick = "buyFR('+i+')">Cost: <span id = "fr'+i+'c"></span> forks</button></td>'
	}
	ge("frlist").innerHTML += HTML
	
	//Init tabs.
	var classList = document.getElementsByClassName("tab");
	for(var i = 0; i < classList.length; i++) if (classList[i].id !== "before") classList[i].style.display = "none"
	currenttab = "before"
	
	//Load save.
	reset(Infinity)
	load()
	
	//Init loops.
	setInterval(update, 50)
	setInterval(save, 1e4)
}