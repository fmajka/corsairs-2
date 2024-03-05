import GamePacket from "./GamePacket.js";

export default class SetEntitySpritePacket extends GamePacket {
    type = "SetEntitySprite";
    
    constructor(entity, spriteName) {
        super();
        this.entityId = entity.id;
        this.spriteName = spriteName;
    }
}