const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cghak.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri)


async function run() {

    try {
        await client.connect();
        const database = client.db('bengal_pottery');
        const productsCollection = database.collection('products');
        const orderCollection = database.collection('orderedProducts');
        const usersCollection = database.collection('users');

        //get Products data
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        //receiving purchased ordered data 
        app.post('/orderedProducts', async (req, res) => {
            const orderedProducts = req.body;
            const order = await orderCollection.insertOne(orderedProducts);
            // console.log(orderedProducts);
            res.json(order);
        })
        //admin data collecting
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })



        //fetching ordered DB data
        app.get('/orderedProducts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            // console.log(query)
            const cursor = orderCollection.find(query);
            // const cursor = orderCollection.find({});
            const orders = await cursor.toArray();
            res.json(orders);
        })
        //storing user data to DB

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result)
            res.json(result);
        })

        //storing google login user's data to DB
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })
        //Creating Admin
        app.put('/user/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);

        })

        //Add products
        app.post('/addProducts', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            // console.log(result);
            res.send(result);
        });
        // showing added product to UI
        app.get('/products', async (req, res) => {
            // const products = req.body;
            const result = await productsCollection.find({}).toArray();
            res.send(result);
        })
        //get single product
        app.get('/singleProduct/:id', async (req, res) => {
            const result = await productsCollection.find({ _id: ObjectId(req.params.id) }).toArray();
            // console.log(result)
            res.send(result[0]);
        });
        ///delete order from dashboard
        app.delete('/deleteOrder/:id', async (req, res) => {
            const result = await orderCollection.deleteOne({ _id: ObjectId(req.params.id) });
            res.send(result);
        });

        //get all orders

    }

    finally {
        //await client close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello bengal pottery!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})