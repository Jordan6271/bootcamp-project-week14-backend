const express = require(`express`);
const bodyParser = require(`body-parser`);
const cors = require(`cors`);
const helmet = require(`helmet`);
const morgan = require(`morgan`);
const mongoose = require(`mongoose`);
const { ObjectId } = require(`mongodb`);

const { Event } = require(`../models/Event`);
const { User } = require(`../models/User`);
const { v4: uuidv4 } = require(`uuid`);

const dburi =
    process.env.MONGO_URI ||
    `mongodb+srv://Jordan:fbNyeIkb2sokJLzJ@cluster0.w75uz.mongodb.net/auth?retryWrites=true&w=majority`;

mongoose.connect(dburi);

const eventful = express();

// Helmet enhances API security
eventful.use(helmet());

// bodyParser parses JSON bodies into JS objects - needed for logging in on frontend
eventful.use(bodyParser.json());

// Enables CORS for requests
eventful.use(cors());

// Morgan logs http requests
eventful.use(morgan(`combined`));

eventful.post(`/auth`, async (request, response) => {
    const user = await User.findOne({ username: request.body.username });
    if (!user) {
        return response.sendStatus(401);
    }
    if (request.body.password !== user.password) {
        return response.sendStatus(403);
    }
    user.token = uuidv4();
    await user.save();
    response.send({ token: user.token });
});

eventful.use(async (request, response, next) => {
    const authHeader = request.headers[`authorization`];
    const user = await User.findOne({ token: authHeader });
    if (user) {
        next();
    } else {
        response.sendStatus(403);
    }
});

// CRUD operations
eventful.get(`/`, async (request, response) => {
    response.send(await Event.find());
});

eventful.post(`/`, async (request, response) => {
    const newEvent = request.body;
    const event = new Event(newEvent);
    await event.save();
    response.send({ message: `New event created.` });
});

eventful.delete(`/:id`, async (request, response) => {
    await Event.deleteOne({ _id: ObjectId(request.params.id) });
    response.send({ message: `Event removed.` });
});

eventful.put(`/:id`, async (request, response) => {
    await Event.findOneAndUpdate(
        { _id: ObjectId(request.params.id) },
        request.body
    );
    response.send({ message: `Event updated.` });
});

eventful.listen(3001, () => {
    console.log(`Listening on port 3001`);
});

var database = mongoose.connection;
database.on(`error`, console.error.bind(console, `connection error: `));
database.once(`open`, function callback() {
    console.log(`Database connected!`);
});
