const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

const admin = require("firebase-admin");

const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());

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

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Smart server is running");
});

async function run() {
  try {
    await client.connect();

    const categoriesDB = client.db("categoriesDB");
    const codesDB = client.db("categoriesDB");
    const categoriesCollection = categoriesDB.collection("categories");
    const codesCollection = codesDB.collection("codes");

    // categories APIs

    // get all categories by user email
    app.get("/categories/", verifyFireBaseToken, async (req, res) => {
      const currentUserEmail = req.token_email;
      const query = {};
      if (currentUserEmail) {
        query.email = currentUserEmail;
      }
      const cursor = categoriesCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get categories count by user email
    app.get("/total-categories/", verifyFireBaseToken, async (req, res) => {
      const currentUserEmail = req.token_email;
      const query = {};
      if (currentUserEmail) {
        query.email = currentUserEmail;
      }
      const cursor = categoriesCollection.countDocuments(query);
      const result = await cursor;
      res.send(result);
    });

    // get a specific category by a user
    app.get("/category/:id", verifyFireBaseToken, async (req, res) => {
      const id = req.params.id;
      const currentUserEmail = req.token_email;

      try {
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
      const currentUserEmail = req.token_email;
      const newCategory = req.body;
      newCategory.email = currentUserEmail;
      try {
        const result = await categoriesCollection.insertOne(newCategory);
        res.send(result);
      } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // update a category
    app.patch("/categories/:id", verifyFireBaseToken, async (req, res) => {
      const id = req.params.id;
      const updatedCategory = req.body;
      const currentUserEmail = req.token_email;

      try {
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
      const id = req.params.id; // The category ID from the URL
      const currentUserEmail = req.token_email;
      const categoryQuery = { _id: new ObjectId(id) }; // Mongo query to find the category

      try {
        // Fetch the category to check its existence and ownership
        const category = await categoriesCollection.findOne(categoryQuery);

        if (!category) {
          return res.status(404).send({ message: "Category not found" });
        }

        if (category.email !== currentUserEmail) {
          return res.status(403).send({
            message: "You are not authorized to delete this category",
          });
        }

        // Delete all codes related to this category by using the category's _id
        const codesQuery = { categoryId: id }; // Assuming categoryId is the field
        const deleteCodesResult = await codesCollection.deleteMany(codesQuery); // Delete all related codes

        if (deleteCodesResult.deletedCount === 0) {
          console.log("No codes found for this category to delete.");
        } else {
          console.log(`${deleteCodesResult.deletedCount} codes deleted.`);
        }

        // Now delete the category itself
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
      const categoryId = req.params.id;
      const currentUserEmail = req.token_email;
      if (!currentUserEmail) {
        return res
          .status(401)
          .send({ message: "Unauthorized. No email provided." });
      }
      try {
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
    app.get("/total-codes/", verifyFireBaseToken, async (req, res) => {
      const currentUserEmail = req.token_email;
      const query = {};
      if (currentUserEmail) {
        query.email = currentUserEmail;
      }
      const cursor = codesCollection.countDocuments(query);
      const result = await cursor;
      res.send(result);
    });

    // get a specific code
    app.get("/code/:id", verifyFireBaseToken, async (req, res) => {
      const id = req.params.id;
      const currentUserEmail = req.token_email;
      try {
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
        res.send(code);
      } catch (error) {
        console.error("Error getting code:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // add a code
    app.post("/codes/:id", verifyFireBaseToken, async (req, res) => {
      const categoryId = req.params.id;
      const currentUserEmail = req.token_email;
      const newCode = req.body;
      newCode.email = currentUserEmail;
      try {
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
      const id = req.params.id;
      const updatedCategory = req.body;
      const currentUserEmail = req.token_email;

      try {
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
            title: updatedCategory.title,
            code: updatedCategory.code,
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
      const id = req.params.id;
      const currentUserEmail = req.token_email;
      const query = { _id: new ObjectId(id) };

      try {
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

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Smart server is running on port: ${port}`);
});
