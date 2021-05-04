const express = require(`express`);
const bodyParser = require(`body-parser`);
const cors = require(`cors`);
const helmet = require(`helmet`);
const morgan = require(`morgan`);
const mongoose = require(`mongoose`);
const { ObjectId } = require(`mongodb`);

const { Event } = require(`../models/Event`);
const { User } = require(`../models/User`);

mongoose.connect(`mongodb://localhost/eventful`);

const eventful = express();

// Helmet enhances API security
eventful.use(helmet());

// Body Parser parses JSON bodies into JS objects
eventful.use(bodyParser.json());

// Enables CORS for requests
eventful.use(cors());

// Morgan logs http requests
eventful.use(morgan(`combined`));

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
