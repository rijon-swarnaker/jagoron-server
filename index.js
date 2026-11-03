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
const joinedEventsCollection = db.collection("joinedEvents");


app.delete('/manage-events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventsCollection.deleteOne({
      _id: new ObjectId (id)
    });
    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Event not found"
      });
    }
    res.send({
      success: true,
      message: "Event deleted successfully",
      result
    });
  } catch (error) {
    res.status(500).send({
      message: "Error deleting manage-event"
    });
  }
});

app.post("/join-event", async (req, res) => {
  try {
    const event = req.body;

    if (!event || !event.eventId || !event.email) {
      return res.status(400).send({
        success: false,
        message: "Event ID and User Email are required!",
      });
    }

    const alreadyJoined = await joinedEventsCollection.findOne({
      eventId: event.eventId,
      email: event.email,
    });

    if (alreadyJoined) {
      return res.status(409).send({
        success: false,
        message: "Already Joined This Event!",
      });
    }

    const result = await joinedEventsCollection.insertOne({
      ...event,
      joinedAt: new Date(),
    });

    return res.status(201).send({
      success: true,
      message: "Successfully Joined Event!",
      insertedId: result.insertedId,
    });

  } catch (error) {
    console.error("Join Event Error:", error);

  
    if (error.code === 11000) {
      return res.status(409).send({
        success: false,
        message: "Already Joined This Event!",
      });
    }

    return res.status(500).send({
      success: false,
      message: "Internal Server Error!",
    });
  }
});


app.get("/joined-events/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const result = await joinedEventsCollection
      .find({ email: email })
      .sort({ eventDate: 1 })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Server Error!" });
  }
});

app.get("/manage-events/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const result = await eventsCollection
      .find({ organizerEmail: email })
      .sort({ eventDate: 1})
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server Error!"
    });
  }
});

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

app.get("/upcoming-event/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventsCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching event by ID" });
  }
});

// upcoming events with category filter
//upcoming-events?category=all or category

app.get("/upcoming-events", async (req, res) => {
  try {
    const { category } = req.query;
    const today = new Date().toISOString().split("T")[0];
    const query = {
      eventDate: { $gte: today },
    };
    if (category && category !== "all") {
      query.eventType = category;
    }
    const data = await eventsCollection
      .find(query)
      .sort({ eventDate: 1 })
      .toArray();

    res.send(data);
  } catch (error) {
    res.status(500).send({ message: "Error fetching upcoming events" });
  }
});

app.get("/event-categories", async (req, res) => {
  try {
    const categories = await eventsCollection.distinct("eventType");
    res.send(categories);
  } catch (error) {
    res.status(500).send({ message: "Error fetching event categories" });
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
