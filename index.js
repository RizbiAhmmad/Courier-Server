const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const axios = require("axios");

const sendSMS = async (phone, message) => {
  try {
    const apiKey = process.env.BULKSMS_API_KEY;
    const senderId = process.env.BULKSMS_SENDER_ID;

    console.log("API KEY:", apiKey);
    console.log("SENDER ID:", senderId);
    console.log("SMS PHONE:", phone);
    console.log("SMS MESSAGE:", message);

    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${phone}&senderid=${senderId}&message=${encodeURIComponent(
      message,
    )}`;

    console.log("Attempting SMS via URL:", url);
    const res = await axios.get(url);

    console.log("BulkSMS API Response Data:", res.data);

    return res.data;
  } catch (err) {
    console.error("SMS Network/System Error:", err.message);
    return null;
  }
};

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
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
  const last4 = Date.now().toString().slice(-4);
  const random2 = Math.floor(10 + Math.random() * 90); // 2 digit
  return `TRK${last4}${random2}`;
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
    const blogsCollection = database.collection("blogs");
    const gtmCollection = database.collection("gtm");
    const noticeCollection = database.collection("notice");
    const expenseCategoriesCollection =
      database.collection("expenseCategories");
    const expensesCollection = database.collection("expenses");

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

    // app.post("/shipments", async (req, res) => {
    //   try {
    //     const shipment = req.body;
    //     const trackingId = generateTrackingId();

    //     const newShipment = {
    //       ...shipment,
    //       trackingId,
    //       status: "pending",
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     };

    //     const result = await shipmentsCollection.insertOne(newShipment);

    //     res.send(newShipment);
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).send({ message: "Failed to create shipment" });
    //   }
    // });

    app.post("/shipments", async (req, res) => {
  try {
    const shipment = req.body;

    shipment.trackingId = generateTrackingId();

    shipment.createdAt = new Date();
    shipment.status = "pending";

    const result = await shipmentsCollection.insertOne(shipment);

    // SMS
    try {
      const customerName = shipment.name || "Customer";

      const smsText = `Hello ${customerName},
Your shipment confirmed.
Tracking ID: ${shipment.trackingId}
Track here:
https://yourdomain.com/track/${shipment.trackingId}`;

      let phone = shipment.phone?.toString().replace(/\D/g, "") || "";

      if (phone.startsWith("0")) phone = "88" + phone;
      else if (!phone.startsWith("88")) phone = "88" + phone;

      await sendSMS(phone, smsText);
    } catch (e) {}

    res.send({
      success: true,
      trackingId: shipment.trackingId,   
      insertedId: result.insertedId,
      ...shipment
    });
  } catch (err) {
    res.status(500).send({ message: "Shipment create failed" });
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

        const totalShipping =
          updatedShipment.packages?.reduce(
            (sum, box) => sum + Number(box.shippingCost || 0),
            0,
          ) || 0;

        const filter = { _id: new ObjectId(id) };

        const updateDoc = {
          $set: {
            ...updatedShipment,
            totalShipping,
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

    // app.patch("/shipments/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const { status } = req.body;

    //     if (!status) {
    //       return res.status(400).send({ message: "Status is required" });
    //     }

    //     const result = await shipmentsCollection.updateOne(
    //       { _id: new ObjectId(id) },
    //       {
    //         $set: {
    //           status,
    //           updatedAt: new Date(),
    //         },
    //       },
    //     );

    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ message: "Failed to update shipment" });
    //   }
    // });

    app.patch("/shipments/:id/status", async (req, res) => {
      try {
        const { status } = req.body;
        const id = req.params.id;

        const shipment = await shipmentsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!shipment) {
          return res.status(404).send({ message: "Shipment not found" });
        }

        await shipmentsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } },
        );

        //  SMS Text
        let smsText = "";

        if (status === "processing") {
          smsText = `Hello ${shipment.name}, your parcel (${shipment.trackingId}) is now processing.`;
        }

        if (status === "shipped") {
          smsText = `Good news! Your parcel (${shipment.trackingId}) has been shipped 🚚`;
        }

        if (status === "delivered") {
          smsText = `Parcel Delivered Successfully ✅ Tracking ID: ${shipment.trackingId}`;
        }

        if (status === "cancelled") {
          smsText = `Your parcel (${shipment.trackingId}) has been cancelled.`;
        }

        if (smsText) {
          let phone = shipment.phone?.toString().replace(/\D/g, "") || "";

          if (phone.startsWith("0")) phone = "88" + phone;
          else if (!phone.startsWith("88")) phone = "88" + phone;

          await sendSMS(phone, smsText);
        }

        res.send({
          success: true,
          message: "Shipment status updated & SMS sent",
        });
      } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Server error" });
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

    app.get("/sales-report", async (req, res) => {
      try {
        const { startDate, endDate } = req.query;

        const query = {
          status: "delivered",
        };

        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);

          // end date → next day
          end.setDate(end.getDate() + 1);

          query.createdAt = {
            $gte: start,
            $lt: end, // important
          };
        }

        const shipments = await shipmentsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(shipments);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch sales report" });
      }
    });

    // Add blog
    app.post("/blogs", async (req, res) => {
      const blog = req.body;

      const result = await blogsCollection.insertOne(blog);

      res.send(result);
    });

    // Get all blogs
    app.get("/blogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();

      res.send(result);
    });

    // Get single blog
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;

      const result = await blogsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // Update blog
    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;

      const updated = req.body;

      const result = await blogsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            title: updated.title,
            description: updated.description,
            tag: updated.tag,
            status: updated.status,
            image: updated.image || null,
          },
        },
      );

      res.send(result);
    });

    // Delete blog
    app.delete("/blogs/:id", async (req, res) => {
      const id = req.params.id;

      const result = await blogsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.post("/gtm", async (req, res) => {
      try {
        const { gtmId, enableGtm } = req.body;

        const filter = {};
        const updateDoc = {
          $set: {
            gtmId,
            enableGtm,
          },
        };
        const options = { upsert: true };

        const result = await gtmCollection.updateOne(
          filter,
          updateDoc,
          options,
        );

        res.send({
          success: true,
          message: "GTM settings updated",
          result,
        });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.get("/gtm", async (req, res) => {
      const gtm = await gtmCollection.findOne({});
      res.send(gtm);
    });

    app.post("/notice", async (req, res) => {
      try {
        const { title, description, buttonText, delay, isActive } = req.body;

        const filter = {};
        const updateDoc = {
          $set: {
            title,
            description,
            buttonText,
            delay: Number(delay) || 3000,
            isActive: Boolean(isActive),
          },
        };

        const options = { upsert: true };

        const result = await noticeCollection.updateOne(
          filter,
          updateDoc,
          options,
        );

        res.send({ success: true, result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.get("/notice", async (req, res) => {
      const notice = await noticeCollection.findOne({});
      res.send(notice);
    });

    // Add Expense Category
    app.post("/expense-categories", async (req, res) => {
      const expenseCategory = req.body;
      const result =
        await expenseCategoriesCollection.insertOne(expenseCategory);
      res.send(result);
    });

    // Get Expense Categories
    app.get("/expense-categories", async (req, res) => {
      const result = await expenseCategoriesCollection.find().toArray();
      res.send(result);
    });

    // Delete Expense Category
    app.delete("/expense-categories/:id", async (req, res) => {
      const id = req.params.id;
      const result = await expenseCategoriesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Update Expense Category
    app.put("/expense-categories/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      try {
        const result = await expenseCategoriesCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              name: updatedData.name,
              status: updatedData.status,
            },
          },
        );

        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "Expense category updated successfully",
          });
        } else {
          res.send({
            success: false,
            message: "No changes made or category not found",
          });
        }
      } catch (error) {
        console.error("Error updating expense category:", error);
        res.status(500).send({
          success: false,
          message: "Failed to update expense category",
        });
      }
    });

    // Add Expense
    app.post("/expenses", async (req, res) => {
      try {
        const expense = {
          ...req.body,
          price: Number(req.body.price), // store as number
          date: new Date(req.body.date), // store as Date
        };

        const result = await expensesCollection.insertOne(expense);
        res.send(result);
      } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).send({ message: "Failed to add expense" });
      }
    });

    // Get All Expenses
    app.get("/expenses", async (req, res) => {
      try {
        const result = await expensesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).send({ message: "Failed to fetch expenses" });
      }
    });

    // Update Expense - ensure proper data types
    app.put("/expenses/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const updatedExpense = {
          ...req.body,
          price: Number(req.body.price), // convert to number
          date: new Date(req.body.date), // convert to Date
        };

        const result = await expensesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedExpense },
        );

        res.send(result);
      } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).send({ message: "Failed to update expense" });
      }
    });

    // Delete Expense
    app.delete("/expenses/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await expensesCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).send({ message: "Failed to delete expense" });
      }
    });

    app.get("/expenses/report", async (req, res) => {
      try {
        const { startDate, endDate } = req.query;

        let filter = {};
        if (startDate && endDate) {
          filter.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }

        const expenses = await expensesCollection
          .find(filter)
          .sort({ date: -1 })
          .toArray();
        const now = new Date();

        const total = expenses.reduce(
          (sum, e) => sum + Number(e.price || 0),
          0,
        );

        if (startDate && endDate) {
          return res.send({
            total,
            allExpenses: expenses,
          });
        }

        // Otherwise full analytics
        const today = expenses
          .filter((e) => new Date(e.date).toDateString() === now.toDateString())
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(now.getDate() - 1);
        const yesterday = expenses
          .filter(
            (e) =>
              new Date(e.date).toDateString() === yesterdayDate.toDateString(),
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const thisWeek = expenses
          .filter((e) => new Date(e.date) >= weekStart)
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const prevWeekStart = new Date(now);
        prevWeekStart.setDate(now.getDate() - 14);
        const prevWeekEnd = new Date(now);
        prevWeekEnd.setDate(now.getDate() - 7);
        const previousWeek = expenses
          .filter(
            (e) =>
              new Date(e.date) >= prevWeekStart &&
              new Date(e.date) < prevWeekEnd,
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const thisMonth = expenses
          .filter(
            (e) =>
              new Date(e.date).getMonth() === now.getMonth() &&
              new Date(e.date).getFullYear() === now.getFullYear(),
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        const previousMonth = expenses
          .filter(
            (e) =>
              new Date(e.date).getMonth() === now.getMonth() - 1 &&
              new Date(e.date).getFullYear() === now.getFullYear(),
          )
          .reduce((sum, e) => sum + Number(e.price || 0), 0);

        res.send({
          total,
          today,
          yesterday,
          thisWeek,
          previousWeek,
          thisMonth,
          previousMonth,
          allExpenses: expenses,
        });
      } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).send({ message: "Failed to generate report" });
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
