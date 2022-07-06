const express = require("express")
const app = express()
const mongoose = require("mongoose")
const bp = require("body-parser")
const fetch = require('node-fetch');
const { stringify } = require('querystring');

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.use(express.json());

app.get('/subscribe', (_, res) => res.sendFile(__dirname + '/index.html'));

app.post('/subscribe', async (req, res) => {
  if (!req.body.captcha)
    return res.json({ success: false, msg: 'Please select captcha' });

  // Secret key
  const secretKey = '6Le338ogAAAAAHZ1zJlbEzO-aB-cjfI0RQEzrsf0';

  // Verify URL
  const query = stringify({
    secret: secretKey,
    response: req.body.captcha,
    remoteip: req.connection.remoteAddress
  });
  const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;

  // Make a request to verifyURL
  const body = await fetch(verifyURL).then(res => res.json());

  // If not successful
  if (body.success !== undefined && !body.success)
    return res.json({ success: false, msg: 'Failed captcha verification' });

  // If successful
  return res.json({ success: true, msg: 'Captcha passed' });
});

app.get("/", (req, res) => {
	mongoose.connect(process.env.MONGODB, function(err, db) {
		const data = db.collection("konu")
		data.find().sort({ "_id": -1 }).limit(10).toArray(function(err, results) {
			res.render(process.cwd() + "/views/index.ejs", { results: results })
		  });
	})
})
app.get("/kurallar", (req, res) => {
	mongoose.connect(process.env.MONGODB, function(err, db) {
		const data = db.collection("konu")
		data.find().sort({ "_id": -1 }).limit(10).toArray(function(err, results) {
			res.render(process.cwd() + "/views/kurallar.ejs", { results: results })
		  });
	})
})
app.post("/", (req, res) => {
	if(req.body.konu.length === 0 || req.body.kullanici.length === 0 || req.body.baslik.length === 0 || req.body.konu.length === 0){
		res.redirect("/?hata")
	}else{
		mongoose.connect(process.env.MONGODB, function(err, db) {
			const data = db.collection("konu")
			data.insert({ kullanici: req.body.kullanici, baslik: req.body.baslik, kategori: req.body.kategori, konu: req.body.konu })
			res.redirect("/")
		})
	}
})
app.get("/konu/:id", (req, res) => {
	mongoose.connect(process.env.MONGODB, function(err, db) {
		const data = db.collection("konu")
		data.find({ "_id": mongoose.Types.ObjectId(`${req.params.id}`) }).sort({ "_id": -1 }).limit(10).toArray(function(err, results) {
			data.find().sort({ "_id": -1 }).limit(10).toArray(function(err, comments) {
				const yorum = db.collection("yorum")
			yorum.find({ "id": req.params.id }).toArray(function(err, yorum) {
		res.render(process.cwd() + "/views/konu.ejs", { results: results, comments: comments, yorum: yorum })
		})
	})
	})
})
})

app.post("/konu/:id", (req, res) => {
	if(req.body.yorum.length === 0 || req.body.kullanici.length === 0){
		res.redirect("/?hata")
	}else{
		mongoose.connect(process.env.MONGODB, function(err, db) {
			const data = db.collection("yorum")
			data.insert({ id: req.params.id, yorum: req.body.yorum, kullanici: req.body.kullanici })
			res.redirect(`/konu/${req.params.id}`)
		})
	}
})

app.get("/kategori/:kategori", (req, res) => {
	mongoose.connect(process.env.MONGODB, function(err, db) {
		const data = db.collection("konu")
		data.find({ "kategori": req.params.kategori }).sort({ "_id": -1 }).limit(20).toArray(function(err, results) {
			data.find().sort({ "_id": -1 }).limit(10).toArray(function(err, comments) {
		res.render(process.cwd() + "/views/kategori.ejs", { results: results, comments: comments })
		})
	})
	})
})

app.post("/ara", (req, res) => {
	res.redirect(`/ara/${req.body.ara}`)
})

app.get("/ara/:baslik", (req, res) => {
	mongoose.connect(process.env.MONGODB, function(err, db) {
		const data = db.collection("konu")
		data.find({ "baslik": req.params.baslik }).toArray(function(err, results) {
			data.find().toArray(function(err, comments) {
		res.render(process.cwd() + "/views/ara.ejs", { results: results, comments: comments })
		})
	})
	})
})

app.listen(process.env.PORT || 5000, () => {
    console.log("server aktif")
})
