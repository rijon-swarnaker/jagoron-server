import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("jagoron");
const eventsCollection = db.collection("events");

app.post("/add-events", async (req, res) => {
  const event = req.body;
  const result = await eventsCollection.insertOne(event);
  res.send(result);
});

app.get("/events", async (req, res) => {
  try {
    const data = await eventsCollection.find().toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Error fetching events" });
  }
});

app.get("/upcoming-events", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data = await eventsCollection
      .find({ eventDate: { $gte: today } })
      .sort({ eventDate: 1 })
      .toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Error fetching upcoming events" });
  }
});

app.get("/recent-upcoming-events", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data = await eventsCollection
      .find({ eventDate: { $gte: today } })
      .sort({ eventDate: 1 })
      .limit(6)
      .toArray();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Error fetching upcoming events" });
  }
});

//http://localhost:5000/add-events

app.get("/", (req, res) => {
  res.send({ message: "Welcome to the Jagoron API" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
