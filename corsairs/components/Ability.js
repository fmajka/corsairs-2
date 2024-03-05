export default class Ability {
	constructor(props) {
		this.castPoint = props.castPoint ?? 0;
		this.castDuration = props.castDuration ?? 0;
		this.cooldown = props.cooldown ?? 0;
	}
}