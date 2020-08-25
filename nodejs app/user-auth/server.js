const express = require('express')
const bcrypt = require('bcrypt')
const uuid = require('uuid-random');
const session = require('express-session')
const got = require('got')

const pool = require('./db')

const app = express()

app.use(express.json())



app.post('/users/registration', async (req, res) => {
	try {
		(async () => {
  			const {body} = await got.post('http://localhost:3000/userReg', {
        	json: {
	            username: req.body.username,
	            password: req.body.password
	        },
	        responseType: 'json'
	    });
    		res.send(body);
})();
		} catch(e) {
		res.status(500).send(e)
	}
})

app.post('/users/login', async (req, res) => {
	try {
		(async () => {
  			const {body} = await got.post('http://localhost:3000/userLog', {
        	json: {
	            username: req.body.username,
	            password: req.body.password
	        },
	        responseType: 'json'
	    });
    		res.send(body);
})();
	} catch(e) {
		res.status(500).send(e)
	}
})


app.get('/categories', async(req, res) => {
	try {
		const allCategories = await pool.query('select * from categories');
		res.json(allCategories.rows)

	} catch(e){
		res.status(500).send(e)
	}
}) 

app.post('/addproducts', async (req, res) => {
	try {
		const name = req.body.name;
		const category_id = req.body.category_id;
		await pool.query(`insert into products (name, category_id) values ('${name}', '${category_id}')`);
		await pool.query(`update categories set category_count = category_count + 1 where category_id = $1`, [category_id]);
		res.status(200).send("Product added");
	} catch(e) {
		console.log(e)
		res.status(500).send(e)
	}
	
})

app.post('/getproducts', async(req, res) => {
	try {
		const category_id = req.body.category_id;
		var productNames;
		if (category_id != null) {
			productNames = await pool.query(`select name from products where category_id = $1`, [category_id]);
		} else {
			productNames = await pool.query('select name from products');
		}
		res.send(productNames.rows)
	} catch(e){
		res.status(500).send(e)
	}
}) 

app.post('/deleteproducts', async (req, res) => {
	try {
		const product_id = req.body.product_id
		const product = await pool.query(`select * from products where product_id = $1`, [product_id]);
		const category_id = product.rows[0].category_id
		if (product_id == null) {
			console.log("No product with given ID")
		} else {
			await pool.query(`delete from products where product_id = $1`, [product_id]);
			await pool.query(`delete from favorites where product_id = $1`, [product_id]);
			await pool.query(`update categories set category_count = category_count - 1 where category_id = $1`, [category_id]);
		}

		res.status(200).send("Product deleted");
	} catch(e) {
		console.log(e)
		res.status(500).send(e)
	}
	
})


app.post('/addfavorite', async (req, res) => {
	try {
		const product_id = req.body.product_id
		if (product_id == null) {
			console.log("No product with given ID")
		} else {
			(async () => {
  			const {body} = await got.post('http://localhost:3000/getuserid', {
        	json: {
	            session: req.body.session
	        },
	        responseType: 'json'
	    });
			if (body.error) {
				res.send(body.error)
				return
			}else{
    		const userID = body.user_id
    		await pool.query(`insert into favorites (user_id, product_id) values (${userID}, ${product_id})`);
    		res.status(200).send("Product added to Favorites")

    	}
})();
		}
	} catch(e) {
		res.status(500).send(e)
		console.log(e)
	}
 })

app.post('/getfavorite', async (req, res) => {
	try {
		(async () => {
  		const {body} = await got.post('http://localhost:3000/getuserid', {
        json: {
	        session: req.body.session
	    },
	    responseType: 'json'
	    });
		if (body.error) {
			res.send(body.error)
			return
		} else {
    		const userID = body.user_id
			const favorite = await pool.query(`select name from favorites inner join products on products.product_id = favorites.product_id where user_id = '${userID}'`);
			res.send(favorite.rows)
    		res.status(200).send("Product added to Favorites")
    	}
})();
		
	} catch(e) {
		res.status(500).send(e)
		console.log(e)
	}
 })


app.listen(3001)