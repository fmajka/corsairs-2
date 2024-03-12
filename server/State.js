import Crew from "./Crew.js";
import Player from "./Player.js";

// Party system
const crews = [];
const playerNameMap = new Map(); // Maps player names to players
const sockets = new Map(); // Map socket ids to player objects

const arrRemoveItem = (arr, item) => {
	var index = arr.indexOf(item);
  if (index > -1) { arr.splice(index, 1); }
}

// Get player from socketId
function s2p(socketId) {
	return sockets.get(socketId);
}

function c2p(cookie) {
	// TODO: what if no cookie?
	const socketId = cookie.split("=").slice(1).join("=");
	return s2p(socketId);
}

function createPlayer(socket, name) {
	const player = new Player(socket, name);
	socket.player = player;

	playerNameMap.set(name, player);
	sockets.set(socket.id, player);

	return player;
}

function getRandomName() {
	let name = "";
	do {
		const id = Math.floor(100 + Math.random() * 900);
		name = `Corsair${id}`;
	} while(playerNameMap.has(name));
	return name;
}

function getCrewById(id) {
	return crews.find(crew => id == crew.id);
}

function playerCreateCrew(player) {
	if(player.crew) { return player.crew; }

	const crew = new Crew(player);
	player.crew = crew;
	crews.push(crew);
	return crew;
}

function playerLeaveCrew(player) {
	if(!player.crew) { return; }
	const crew = player.crew;
	player.crew = null;

	arrRemoveItem(crew.players, player);
	if(crew.count() == 0) {
		arrRemoveItem(crews, crew);
		return false;
	}
	return true;
}

function deletePlayer(player) {
	playerNameMap.delete(player.name);
	sockets.delete(player.socket.id);
	if(player.crew) {
		playerLeaveCrew(player)
	}
}

export { 
	crews, playerNameMap, sockets, 
	c2p, s2p,
	createPlayer, deletePlayer, getCrewById, playerCreateCrew, playerLeaveCrew,
	getRandomName,
}