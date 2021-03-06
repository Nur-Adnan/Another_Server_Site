const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k0jkj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const carCollection = client.db('CarHouse').collection('service')

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = carCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            console.log(query);
            const car = await carCollection.findOne(query);
            res.send(car);
        })
        //POST
        app.post('/service', async (req, res) => {
            const newcar = req.body;
            const result = await carCollection.insertOne(newcar);
            res.send(result);
        })
        //DELETE
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await carCollection.deleteOne(query);
            res.send(result);
        })
        //PUT
        app.put('/service/:id', async (req, res) => {
            const id = req.params.id;
            const updatecar = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: updatecar.quantity
                }
            };
            const result = await carCollection.updateOne(query, updateDoc, options);
            res.send(result);
        })
        app.get('/service', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = carCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })
        // AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

    }
    finally {

    }
}
run().catch(console.dir);


//To check is it working
app.get('/', (req, res) => {
    res.send('Running Server CarHouse');
});

//listen
app.listen(port, () => {
    console.log('Listening to port', port);
})