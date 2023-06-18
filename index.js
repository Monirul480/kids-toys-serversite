const express = require("express");
const cors = require('cors');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwemohb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productCollection = client.db("toysDB").collection("product");

    // search indexing
    // const indexKeys = { name: 1, selectedValue: 1 };
    // const indexOptions = { name: "nameCata" };
    // const result = await productCollection.createIndex(indexKeys, indexOptions);

    // search api
    app.get("/searchText/:text", async (req, res) => {
      const searchT = req.params.text;
      const result = await productCollection
        .find({
          $or: [
            { name: { $regex: searchT, $options: "i" } },
            { selectedValue: { $regex: searchT, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    // post data mongodb
    app.post("/AddToy", async (req, res) => {
      const addToy = req.body;
      const result = await productCollection.insertOne(addToy);
      res.send(result);
    });

    // create api all toys
    app.get("/AllToys", async(req, res) => {
      const result = await productCollection.find().limit(20).toArray();
      res.send(result);
    });

    // email by toys
    app.get("/MyToys", async (req, res) => {
      const email = req.query.email;
      const toys = await productCollection
        .find({
          email: email,
        })
        .toArray();
      res.send(toys);
    });

    // delete produce
    app.delete("/Delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // single data api
    app.get("/singleData/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    // category ways data load
    app.get("/category/:selectedValue", async (req, res) => {
      const category = req.params.selectedValue;
      const query = { selectedValue: category };
      const result = await productCollection.find(query).limit(3).toArray();
      res.send(result);
    });

    //  update data
    app.put("/UpdateToy/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      console.log(body, id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          price: body.price,
          quantity: body.quantity,
          description: body.description,
        },
      };
      const result = await productCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // short small to large data price create api
    app.get("/sort", async (req, res) => {
      try {
        const email = req.query.email;
        const state = req.query.state;
        const sort = { price: state === 'small' ? 1 : -1 };
        const cursor = productCollection.find({email: email}).sort(sort).toArray();
        const result = await cursor;
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });

    // short Large to small data price create api
    app.get("/sortL", async (req, res) => {
      try {
        const query = {};
        const sort = { price: -1 };
        const cursor = productCollection.find(query).sort(sort).toArray();
        const result = await cursor;
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Kids toys server running");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
