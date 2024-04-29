import { initializeApp, cert } from 'firebase-admin/app';
import serviceAccount from "../local/korsarze-2-firebase-key.json" with { type: "json" };
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: cert(serviceAccount),
	databaseURL: "https://korsarze-2.firebaseio.com",
});

const db = getFirestore();
const refStats =  db.collection("stats");

export { refStats };