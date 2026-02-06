const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ppobgmi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    const database = client.db("CourierDB");
    const usersCollection = database.collection("users");
    const categoriesCollection = database.collection("categories");
    const courierTypesCollection = database.collection("courierTypes");
    const countriesCollection = database.collection("countries");

    // POST endpoint to save user data (with role)
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      // console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Get role by email
    app.get("/users/role", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      if (!user) {
        return res.status(404).send({ role: null, message: "User not found" });
      }
      res.send({ role: user.role });
    });

    // PATCH endpoint to update user role dynamically
    app.patch("/users/role/:id", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body; // receive new role from frontend

      if (!role) {
        return res.status(400).send({ message: "Role is required" });
      }

      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role } };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // GET user profile
    app.get("/users/profile", async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    // PATCH user profile
    app.patch("/users/profile/:email", async (req, res) => {
      const email = req.params.email;
      const { name, photoURL, address, phone } = req.body;

      const updateDoc = {
        $set: {
          name,
          photoURL,
          address,
          phone,
          updatedAt: new Date(),
        },
      };

      const result = await usersCollection.updateOne({ email }, updateDoc);
      res.send(result);
    });

    // DELETE endpoint to remove a user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Add a new category
    app.post("/categories", async (req, res) => {
      const category = req.body;
      const result = await categoriesCollection.insertOne(category);
      res.send(result);
    });

    // Get all categories
    app.get("/categories", async (req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    });

    // Get a single category by ID
    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const category = await categoriesCollection.findOne(query);
      res.send(category);
    });

    // Update a category by ID
    app.put("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCategory = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: updatedCategory.name,
          status: updatedCategory.status,
        },
      };
      const result = await categoriesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete a category by ID
    app.delete("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await categoriesCollection.deleteOne(query);
      res.send(result);
    });

    // Add courier type
    app.post("/courierTypes", async (req, res) => {
      const courierType = req.body;
      const result = await courierTypesCollection.insertOne(courierType);
      res.send(result);
    });

    // Get all courier types
    app.get("/courierTypes", async (req, res) => {
      const result = await courierTypesCollection.find().toArray();
      res.send(result);
    });

    // Get single courier type
    app.get("/courierTypes/:id", async (req, res) => {
      const result = await courierTypesCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Update courier type
    app.put("/courierTypes/:id", async (req, res) => {
      const { name, status } = req.body;

      const result = await courierTypesCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { name, status } },
      );

      res.send(result);
    });

    // Delete courier type
    app.delete("/courierTypes/:id", async (req, res) => {
      const result = await courierTypesCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Add new country
    app.post("/countries", async (req, res) => {
      const country = req.body;
      const result = await countriesCollection.insertOne(country);
      res.send(result);
    });

    // Get all countries
    app.get("/countries", async (req, res) => {
      const result = await countriesCollection.find().toArray();
      res.send(result);
    });

    // Get single country by ID
    app.get("/countries/:id", async (req, res) => {
      const id = req.params.id;
      const country = await countriesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(country);
    });

    // Update country by ID
    app.put("/countries/:id", async (req, res) => {
      const id = req.params.id;
      const { name, status } = req.body;
      const updateDoc = { $set: { name, status } };
      const result = await countriesCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc,
      );
      res.send(result);
    });

    // Delete country by ID
    app.delete("/countries/:id", async (req, res) => {
      const id = req.params.id;
      const result = await countriesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!",
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to you in Courier Server");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
