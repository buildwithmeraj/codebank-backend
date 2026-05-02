const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const corsOrigin = process.env.CLIENT_URL || "http://localhost:5173";

const admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(
  cors(
    // {
    //   origin: "https://codebank.meraj.pro",
    //   credentials: true,
    // },
    {
      origin: corsOrigin,
      credentials: true,
    }
  )
);
app.use(express.json());

const isValidObjectId = (id) => ObjectId.isValid(id);

const verifyFireBaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

const uri = process.env.mongodb_uri;

// Create client outside with better options for serverless
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 0,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
});

// Cache the database connections
let categoriesDB;
let codesDB;
let categoriesCollection;
let codesCollection;

// Connection function
async function connectDB() {
  if (!categoriesDB) {
    await client.connect();
    categoriesDB = client.db("categoriesDB");
    codesDB = client.db("categoriesDB");
    categoriesCollection = categoriesDB.collection("categories");
    codesCollection = codesDB.collection("codes");
    console.log("Connected to MongoDB!");
  }
  return { categoriesCollection, codesCollection };
}

app.get("/", (req, res) => {
  res.send("Smart server is running");
});

// categories APIs

// get all categories by user email
app.get("/categories", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection } = await connectDB();
    const currentUserEmail = req.token_email;
    const query = { email: currentUserEmail };
    const cursor = categoriesCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// get categories count by user email
app.get("/total-categories", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection } = await connectDB();
    const currentUserEmail = req.token_email;
    const query = { email: currentUserEmail };
    const result = await categoriesCollection.countDocuments(query);
    res.send({ count: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// get a specific category by a user
app.get("/category/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection } = await connectDB();
    const id = req.params.id;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "Invalid category id" });
    }

    const category = await categoriesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }
    if (category.email !== currentUserEmail) {
      return res.status(403).send({
        message: "You are not authorized to view this category",
      });
    }
    res.send(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// add a category
app.post("/categories", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection } = await connectDB();
    const currentUserEmail = req.token_email;
    const newCategory = req.body;
    newCategory.email = currentUserEmail;
    const result = await categoriesCollection.insertOne(newCategory);
    res.send(result);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// update a category
app.patch("/categories/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection } = await connectDB();
    const id = req.params.id;
    const updatedCategory = req.body;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "Invalid category id" });
    }

    const category = await categoriesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }

    if (category.email !== currentUserEmail) {
      return res.status(403).send({
        message: "You are not authorized to update this category",
      });
    }

    const query = { _id: new ObjectId(id) };
    const update = {
      $set: {
        title: updatedCategory.title,
        image: updatedCategory.image,
      },
    };

    const result = await categoriesCollection.updateOne(query, update);
    res.send(result);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// delete a category and its associated codes
app.delete("/categories/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection, codesCollection } = await connectDB();
    const id = req.params.id;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "Invalid category id" });
    }
    const categoryQuery = { _id: new ObjectId(id) };

    const category = await categoriesCollection.findOne(categoryQuery);

    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }

    if (category.email !== currentUserEmail) {
      return res.status(403).send({
        message: "You are not authorized to delete this category",
      });
    }

    const codesQuery = { categoryId: id };
    const deleteCodesResult = await codesCollection.deleteMany(codesQuery);

    console.log(`${deleteCodesResult.deletedCount} codes deleted.`);

    const deleteCategoryResult = await categoriesCollection.deleteOne(
      categoryQuery
    );

    if (deleteCategoryResult.deletedCount === 0) {
      return res
        .status(404)
        .send({ message: "Category not found or already deleted" });
    }

    res.send({
      message: "Category and associated codes deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category and codes:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// codes APIs

// get all codes from user with category id and user email
app.get("/codes/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection, codesCollection } = await connectDB();
    const categoryId = req.params.id;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(categoryId)) {
      return res.status(400).send({ message: "Invalid category id" });
    }

    if (!currentUserEmail) {
      return res
        .status(401)
        .send({ message: "Unauthorized. No email provided." });
    }

    const category = await categoriesCollection.findOne({
      _id: new ObjectId(categoryId),
      email: currentUserEmail,
    });

    if (!category) {
      return res.status(403).send({
        message: "Category not found or not owned by the current user",
      });
    }

    const query = { categoryId: categoryId };
    const cursor = codesCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching codes:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// get codes count by user email
app.get("/total-codes", verifyFireBaseToken, async (req, res) => {
  try {
    const { codesCollection } = await connectDB();
    const currentUserEmail = req.token_email;
    const query = { email: currentUserEmail };
    const result = await codesCollection.countDocuments(query);
    res.send({ count: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// get all codes for current user (for search functionality)
app.get("/all-codes", verifyFireBaseToken, async (req, res) => {
  try {
    const { codesCollection } = await connectDB();
    const currentUserEmail = req.token_email;

    if (!currentUserEmail) {
      return res
        .status(401)
        .send({ message: "Unauthorized. No email provided." });
    }

    const query = { email: currentUserEmail };
    const cursor = codesCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching all codes:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// get a specific code
app.get("/code/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { codesCollection } = await connectDB();
    const id = req.params.id;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "Invalid code id" });
    }

    const code = await codesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!code) {
      return res.status(404).send({ message: "Code not found" });
    }

    if (code.email !== currentUserEmail) {
      return res.status(403).send({
        message: "You are not authorized to view this code",
      });
    }
    res.send(code);
  } catch (error) {
    console.error("Error getting code:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// add a code
app.post("/codes/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { categoriesCollection, codesCollection } = await connectDB();
    const categoryId = req.params.id;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(categoryId)) {
      return res.status(400).send({ message: "Invalid category id" });
    }
    const newCode = req.body;
    newCode.email = currentUserEmail;
    newCode.categoryId = categoryId;

    const category = await categoriesCollection.findOne({
      _id: new ObjectId(categoryId),
      email: currentUserEmail,
    });

    if (!category) {
      return res.status(403).send({
        message: "Category not found or not owned by the current user",
      });
    }

    const result = await codesCollection.insertOne(newCode);
    res.send(result);
  } catch (error) {
    console.error("Error adding code:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// update a code
app.patch("/codes/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { codesCollection } = await connectDB();
    const id = req.params.id;
    const updatedCode = req.body;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "Invalid code id" });
    }

    const code = await codesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!code) {
      return res.status(404).send({ message: "Code not found" });
    }

    if (code.email !== currentUserEmail) {
      return res.status(403).send({
        message: "You are not authorized to update this code",
      });
    }

    const query = { _id: new ObjectId(id) };
    const update = {
      $set: {
        title: updatedCode.title,
        code: updatedCode.code,
      },
    };

    const result = await codesCollection.updateOne(query, update);
    res.send(result);
  } catch (error) {
    console.error("Error updating code:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// delete a code
app.delete("/codes/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const { codesCollection } = await connectDB();
    const id = req.params.id;
    const currentUserEmail = req.token_email;
    if (!isValidObjectId(id)) {
      return res.status(400).send({ message: "Invalid code id" });
    }
    const query = { _id: new ObjectId(id) };

    const code = await codesCollection.findOne(query);

    if (!code) {
      return res.status(404).send({ message: "Code not found" });
    }

    if (code.email !== currentUserEmail) {
      return res.status(403).send({
        message: "You are not authorized to delete this code",
      });
    }

    const result = await codesCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Error deleting code:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Smart server is running on port: ${port}`);
});

// For Vercel serverless
module.exports = app;
