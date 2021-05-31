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
const { check, validationResult } = require("express-validator");

const dburi =
    process.env.MONGO_URI ||
    `mongodb+srv://Jordan:fbNyeIkb2sokJLzJ@cluster0.w75uz.mongodb.net/auth?retryWrites=true&w=majority`;

mongoose.connect(dburi);

const eventful = express();
const port = process.env.PORT || 3001;

// Helmet enhances API security
eventful.use(helmet());

// bodyParser parses JSON bodies into JS objects - needed for logging in on frontend
eventful.use(bodyParser.json());

// Enables CORS for requests
eventful.use(cors());

// Morgan logs http requests
eventful.use(morgan(`combined`));

eventful.post(
    `/auth`,
    [
        check(`username`, `Username is required`).not().isEmpty(),

        check(`password`, `Password is required`).not().isEmpty(),
    ],
    async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }
        const user = await User.findOne({
            username: request.body.username,
        });
        if (!user) {
            return response
                .status(400)
                .json({ errors: [{ msg: `Invalid username` }] });
        }
        if (request.body.password !== user.password) {
            return response
                .status(400)
                .json({ errors: [{ msg: `Invalid password` }] });
        }
        user.token = uuidv4();
        await user.save();
        response.send({ token: user.token });
    }
);

eventful.use(async (request, response, next) => {
    const authHeader = request.headers[`authorization`];
    const user = await User.findOne({ token: authHeader });
    if (user) {
        next();
    } else {
        response.status(400).send(`Forbidden access`);
    }
});

// CRUD operations
eventful.get(`/`, async (_, response) => {
    try {
        response.send(await Event.find());
    } catch (error) {
        response.status(500).send(`Server error: ${error}`);
    }
});

eventful.post(
    `/`,
    [
        check(`name`, `The name of the event is required`).not().isEmpty(),
        check(`location`, `The location of the event is required`)
            .not()
            .isEmpty(),
        check(`description`, `The description of the event is required`)
            .not()
            .isEmpty(),
        check(`date`, `The date of the event is required`).not().isEmpty(),
        check(`time`, `The time of the event is required`).not().isEmpty(),
    ],
    async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }
        try {
            const event = new Event(request.body);
            await event.save();
            response.send({ message: `New event created.` });
        } catch (error) {
            response.status(500).send(`Server error: ${error}`);
        }
    }
);

eventful.delete(`/:id`, async (request, response) => {
    try {
        await Event.deleteOne({ _id: ObjectId(request.params.id) });
        response.send({ message: `Event removed.` });
    } catch (error) {
        response.status(500).send(`Server error: ${error}`);
    }
});

eventful.put(
    `/:id`,
    [
        check(`name`, `The name of the event is required`).not().isEmpty(),
        check(`location`, `The location of the event is required`)
            .not()
            .isEmpty(),
        check(`description`, `The description of the event is required`)
            .not()
            .isEmpty(),
        check(`date`, `The date of the event is required`).not().isEmpty(),
        check(`time`, `The time of the event is required`).not().isEmpty(),
    ],
    async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }
        try {
            await Event.findOneAndUpdate(
                { _id: ObjectId(request.params.id) },
                request.body
            );
            response.send({ message: `Event updated.` });
        } catch (error) {
            response.status(500).send(`Server error: ${error}`);
        }
    }
);

eventful.listen(port);

var database = mongoose.connection;
database.on(`error`, console.error.bind(console, `connection error: `));
database.once(`open`, function callback() {});
