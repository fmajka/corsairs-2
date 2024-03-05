import GamePacket from "./GamePacket.js";

export default class EntityDeletePacket extends GamePacket {
    type = "EntityDelete";
    
    constructor(entity) {
        super();
        this.entityId = entity.id;
    }
}