
export default class ClearSystem {
	
	static update(session) {
		// Server handles deleting & sends info to clients
		if(session.multiplayer)
			return;

		// Removing the entities locally
		for(let [id, entity] of session.entities.entries()) {
			if(entity.life <= 0) {
				session.entityDelete(entity);
			}
		}
	}

}