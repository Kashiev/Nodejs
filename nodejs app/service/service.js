const express = require('express')
const bcrypt = require('bcrypt')
const uuid = require('uuid-random');
const got = require('got');

const pool = require('./db')

const app = express()

app.use(express.json())


app.post('/userReg', async (req, res) => {
	try {
		console.log(req.body);
		const username = req.body.username;
		const salt = await bcrypt.genSalt()
		const hashedPassword = await bcrypt.hash(req.body.password, salt)
		await pool.query(`insert into users (username, password) values ('${username.toString()}', '${hashedPassword.toString()}')`);
		res.send({message: "User registered"})
	} catch(e) {
		console.log(e);
		res.status(500).send(e)
	}
})

app.post('/userLog', async (req, res) => {
	const username = req.body.username;
	const query = await pool.query(`select * from users where username = '${username.toString()}'`);

	if (query.rows[0].username == null) {
		return res.status(400).send({message: 'cannot find a user'})
	} 
	try {
		if (await bcrypt.compare(req.body.password, query.rows[0].password)) {
			const sessKey = uuid();
			await pool.query(`insert into sessions (key, created, user_id) values ('${sessKey}', now(), '${query.rows[0].user_id}')`);
			res.send({message: "Now you are loged in"})
		} else {
			res.send({message: "Incorrect password or username"})
		} 
	} catch(e) {
		console.log(e)
		res.status(500).send(e)
	}
})

app.post('/getuserid', async (req, res) => {
	try {
		const key = req.body.session;
		let userID = await pool.query(`select user_id from sessions where key = '${key}' and now() - created <= interval '10 minutes'`);
		console.log(userID.rows[0])
		if (userID.rows[0] == null) {
			res.send({error:"Session doesn't exist or expired"})
		} else {
			userID = userID.rows[0].user_id;
			res.status(200).send({user_id: userID})
		}

	} catch(e) {
		res.status(500).send(e)
		console.log(e)
	}
 })


app.listen(3000)