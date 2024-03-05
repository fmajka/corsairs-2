import GamePacket from "./GamePacket.js";

export default class EntityAddPacket extends GamePacket {
    type = "EntityAdd";
    
    constructor(entity, propArr) {
        super();
        this.entityId = entity.id;
        this.entityClass = entity.constructor.name;
        this.x = entity.pos.x;
        this.y = entity.pos.y;
        // Stores additional data to set for the entity
        this.props = {};
        
        // Initialize data object
        for(const prop of propArr) {
            this.props[prop] = entity[prop];
        }
    }
}