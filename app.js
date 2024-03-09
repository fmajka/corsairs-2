import express from "express";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/", express.static('public'));
app.use("/corsairs", express.static('corsairs'));

//app.set("view engine", "ejs");
app.set("view engine", "pug");

// Start server
const server = app.listen(2137, () => {
	console.log("Korsarze żeglują do portu 2137!");
});

export { app, server }