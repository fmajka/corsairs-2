import GamePacket from "./GamePacket.js";

export default class EntitySetPacket extends GamePacket {
    type = "EntitySet";
    
    constructor(entity, propArr) {
        super();
        this.entityId = entity.id;
        // props objects maps object fields to their new props
        this.props = {};

        for(const prop of propArr) {
            this.props[prop] = entity[prop];
        }
    }
}