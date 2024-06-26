import CorsairsServer from "../corsairs/CorsairsServer.js";
import Crew from "./Crew.js";
import User from "./User.js";
import { io } from "./app.js";
import { getDocs } from "firebase/firestore";
import { statsRef } from "./firebase.js";

// Party system
const crews = [];
const usernameMap = new Map(); // Maps usernames to Users
const socketMap = new Map(); // Map socket ids to User objects

/** 
 * Removes the first occurance of 'item' in array 'arr' 
 * @param {Array} arr - Array from which the item should be removed
 * @param {any} item - Item to remove from the array
 * */
const arrRemoveItem = (arr, item) => {
	const index = arr.indexOf(item);
  if (index > -1) { arr.splice(index, 1); }
}

/** 
 * Get user from socketId
 * @param {string} socketId - The user's socketId
 * @returns {User} User data object
 * */
function s2u(socketId) {
	return socketMap.get(socketId);
}

function createUser(socket, name) {
	const player = new User(socket, name);
	socket.player = player;

	usernameMap.set(name, player);
	socketMap.set(socket.id, player);

	return player;
}

function getRandomName() {
	let name = "";
	do {
		const id = Math.floor(100 + Math.random() * 900);
		name = `Korsarz${id}`;
	} while(usernameMap.has(name));
	return name;
}

function getCrewById(id) {
	return crews.find(crew => id == crew.id);
}

function userCreateCrew(player) {
	if(player.crew) { return player.crew; }

	const crew = new Crew(player);
	player.crew = crew;
	crews.push(crew);
	return crew;
}

function userLeaveCrew(player) {
	const crew = player.crew;
	if(!crew) { return; }

	if(player.socket) {
		CorsairsServer.endSession(player.socket.id);
	}

	player.crew = null;
	arrRemoveItem(crew.mates, player);
	// Crew with no members, is it lonely?
	if(crew.count() == 0) {
		arrRemoveItem(crews, crew);
		return false;
	}
	// New captain - first guy from the list
	if(crew.captain == player) {
		crew.captain = crew.mates[0];
	}

	return true;
}

function deleteUser(user) {
	usernameMap.delete(user.name);
	socketMap.delete(user.socket.id);
	if(user.crew) {
		const crew = user.crew;
		userLeaveCrew(user);
		emitCrewChange(crew);
	}
}

///////////////
// Emitting! //
///////////////

function emitCrewChange(crew, target = null) {
	const crewData = { id: crew.id, crew: crew.serialize() };
	if(target) { 
		io.to(target).emit("crew-change", crewData); 
	}
	else {
		io.emit("crew-change", crewData); 
	}
}

function emitUserChange(user) {
	io.to(user.socket.id).emit("user-change", { auth: !!user.uid, avatar: user.avatar, name: user.name });
	if(user.crew) { emitCrewChange(user.crew); }
}

function emitViewToSocket(view, socket) {
	io.to(socket.id).emit("view-change", view);
}

///////////////
// Database! //
///////////////

async function getStats() {
	try {
		const snapshot = await getDocs(statsRef);
		return snapshot.docs.map((doc) => ({ ...doc.data() }));
	} catch(err) {
		console.log(err.message);
		return [];
	}
}

export { 
	crews, 
	s2u, getCrewById, getRandomName,
	createUser, deleteUser, userCreateCrew, userLeaveCrew,
	emitCrewChange, emitUserChange, emitViewToSocket,
	getStats
}