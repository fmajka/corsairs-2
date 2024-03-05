import { app } from "./app.js";
import htmx from "./htmx.js"

app.use("/htmx", htmx);

app.get("/", (_, res) => {
	res.render("index");
});

app.post("/socket-id", (req, res) => {
	console.log("Sending cookie with id: ", req.body);
	res.cookie("id", req.body.id);
	res.send("Cookie Set");
})
