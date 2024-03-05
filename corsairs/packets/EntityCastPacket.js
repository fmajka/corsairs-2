import GamePacket from "./GamePacket.js";

export default class EntityCastPacket extends GamePacket {
    type = "EntityCast";
    
    constructor(entity, abilityId) {
        super();
        this.entityId = entity.id;
        this.abilityId = abilityId;
    }
}