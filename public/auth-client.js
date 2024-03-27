import { auth } from "./firebase-client.js";
import { signInWithEmailAndPassword } from "firebase/auth";

window.authLogin = () => {
	const loginInput = document.querySelector(".input-row.login input");
	const passwordInput = document.querySelector(".input-row.password input");

	signInWithEmailAndPassword(auth, loginInput.value, passwordInput.value)
		.then((res) => {
			console.log(res.user);
		})
		.catch(err => console.log(err));

	return "xd"
}