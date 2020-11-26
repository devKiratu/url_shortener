require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
	res.json({ greeting: "hello API" });
});
// set up and initialize db
const Schema = mongoose.Schema;
const urlSchema = new Schema({
	originalUrl: { type: String, required: true },
	shortUrl: Number,
});

let UrlEntry = mongoose.model("UrlEntry", urlSchema);

//my solution
app.post("/api/shorturl/new", (req, res) => {
	console.log(req.body);
	//validate url
	let test = req.body.url;
	if (!test.includes("http")) {
		res.json({ error: "Invalid URL" });
	} else {
		// shorten url & save to database with reference
		UrlEntry.find({ originalUrl: test }, (err, data) => {
			if (err) {
				console.log(err);
			} else if (data[0] !== undefined) {
				res.json({
					original_url: `${data[0].originalUrl}`,
					short_url: `${data[0].shortUrl}`,
				});
			} else {
				let miniUrl = 1;
				UrlEntry.findOne({})
					.sort({ shortUrl: "desc" })
					.exec((err, data) => {
						if (err) {
							console.log(err);
						} else if (data == undefined) {
							miniUrl = miniUrl;
						} else {
							miniUrl += data.shortUrl;
						}
						let newUrl = new UrlEntry({
							originalUrl: test,
							shortUrl: miniUrl,
						});
						if (mongoose.connection.readyState === 1) {
							newUrl.save((err, data) => {
								if (err) {
									console.log(err);
								} else {
									res.json({
										original_url: newUrl.originalUrl,
										short_url: newUrl.shortUrl,
									});
									console.log(data);
								}
							});
						} else {
							res.json({ error: "Could not write db" });
						}
					});
			}
		});
	}
});

app.get("/api/shorturl/:urlName?", (req, res) => {
	console.log(req.params.urlName);
	let shortCode = req.params.urlName;
	UrlEntry.find({ shortUrl: shortCode })
		.select({ originalUrl: 1 })
		.exec((err, result) => {
			if (err) {
				console.log(err);
			} else if (result[0] == undefined) {
				res.json({ error: "URL not found" });
			} else {
				res.redirect(result[0].originalUrl);
			}
		});
});

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
