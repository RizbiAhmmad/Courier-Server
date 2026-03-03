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

const generateTrackingId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TRK${random}`;
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("CourierDB");
    const usersCollection = database.collection("users");
    const categoriesCollection = database.collection("categories");
    const courierTypesCollection = database.collection("courierTypes");
    const countriesCollection = database.collection("countries");
    const courierRatesCollection = database.collection("courierRates");
const shipmentsCollection = database.collection("shipments");

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

       const { status } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }
      const result = await categoriesCollection.find(query).toArray();
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

    // POST: Add new courier rates
    app.post("/courierRates", async (req, res) => {
      const { categoryId, countryId, variations, status } = req.body;

      if (!categoryId || !countryId || !variations || !variations.length) {
        return res.status(400).send({ message: "Incomplete data" });
      }

      const newCourierRate = {
        categoryId,
        countryId,
        variations,
        status: status || "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await courierRatesCollection.insertOne(newCourierRate);
      res.send(result);
    });

    app.get("/courierRates", async (req, res) => {
      const { categoryId, status } = req.query;

      const query = {};

      if (categoryId) {
        query.categoryId = categoryId;
      }

      if (status) {
        query.status = status;
      }

      const result = await courierRatesCollection.find(query).toArray();
      res.send(result);
    });

    // GET: Get single courier rate by ID
    app.get("/courierRates/:id", async (req, res) => {
      const id = req.params.id;
      const courierRate = await courierRatesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(courierRate);
    });

    // PUT: Update courier rate by ID
    app.put("/courierRates/:id", async (req, res) => {
      const id = req.params.id;
      const { categoryId, countryId, variations, status } = req.body;

      const updateDoc = {
        $set: {
          categoryId,
          countryId,
          variations,
          status,
          updatedAt: new Date(),
        },
      };

      const result = await courierRatesCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc,
      );

      res.send(result);
    });

    // DELETE: Remove courier rate by ID
    app.delete("/courierRates/:id", async (req, res) => {
      const id = req.params.id;
      const result = await courierRatesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

   app.post("/shipments", async (req, res) => {
  try {
    const shipment = req.body;
    const trackingId = generateTrackingId();

    const newShipment = {
      ...shipment,
      trackingId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await shipmentsCollection.insertOne(newShipment);

    // ✅ Send the full shipment object, not just IDs
    res.send(newShipment);

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to create shipment" });
  }
});

app.get("/shipments", async (req, res) => {
  try {
    const { status, trackingId } = req.query;

    const query = {};

    if (status) query.status = status;
    if (trackingId) query.trackingId = trackingId;

    const result = await shipmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch shipments" });
  }
});

app.get("/shipments/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const shipment = await shipmentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!shipment) {
      return res.status(404).send({ message: "Shipment not found" });
    }

    res.send(shipment);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch shipment" });
  }
});

app.get("/track/:trackingId", async (req, res) => {
  try {
    const trackingId = req.params.trackingId;

    const shipment = await shipmentsCollection.findOne({ trackingId });

    if (!shipment) {
      return res.status(404).send({ message: "Tracking ID not found" });
    }

    res.send(shipment);
  } catch (error) {
    res.status(500).send({ message: "Tracking failed" });
  }
});

app.put("/shipments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedShipment = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid shipment ID" });
    }

    const filter = { _id: new ObjectId(id) };

    const updateDoc = {
      $set: {
        ...updatedShipment,
        updatedAt: new Date(),
      },
    };

    const result = await shipmentsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Shipment not found" });
    }

    res.send({
      message: "Shipment updated successfully",
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to update shipment" });
  }
});

app.patch("/shipments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).send({ message: "Status is required" });
    }

    const result = await shipmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update shipment" });
  }
});

app.delete("/shipments/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await shipmentsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete shipment" });
  }
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
