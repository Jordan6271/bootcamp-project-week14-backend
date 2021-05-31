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
const { check, validationResult } = require(`express-validator`);

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
        check(`username`, `Username is required`).exists(),

        check(`password`, `Password is required`).exists(),
    ],
    async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }
        try {
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
        } catch (error) {
            response.status(500).send(`Server error: ${error}`);
        }
    }
);

eventful.use(async (request, response, next) => {
    try {
        const authHeader = request.headers.authorization;
        const user = await User.findOne({ token: authHeader });
        if (user) {
            next();
        } else {
            response
                .status(400)
                .send(`Forbidden access - invalid authorization`);
        }
    } catch (error) {
        response.status(500).send(`Server error: ${error}`);
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
        check(`name`, `The name of the event is required`).exists(),
        check(`location`, `The location of the event is required`).exists(),
        check(
            `description`,
            `The description of the event is required`
        ).exists(),
        check(`date`, `The date of the event is required`).exists(),
        check(`time`, `The time of the event is required`).exists(),
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

eventful.get(`/:id`, async (request, response) => {
    try {
        const foundEvent = await Event.findOne({
            _id: ObjectId(request.params.id),
        });
        if (!foundEvent) {
            return response
                .status(404)
                .send(
                    `This event does not exist. The ID value given is incorrect: ${request.params.id}.`
                );
        }
        response.send(foundEvent);
    } catch (error) {
        response.status(500).send(`Server error: ${error}`);
    }
});

eventful.delete(`/:id`, async (request, response) => {
    try {
        const foundEvent = await Event.findOne({
            _id: ObjectId(request.params.id),
        });
        if (!foundEvent) {
            return response
                .status(404)
                .send(
                    `This event does not exist. The ID value given is incorrect: ${request.params.id}.`
                );
        }
        await Event.deleteOne({
            _id: ObjectId(request.params.id),
        });
        response.send({ message: `Event removed.` });
    } catch (error) {
        response.status(500).send(`Server error: ${error}`);
    }
});

eventful.put(
    `/:id`,
    [
        check(`name`, `The name of the event is required`).exists(),
        check(`location`, `The location of the event is required`).exists(),
        check(
            `description`,
            `The description of the event is required`
        ).exists(),
        check(`date`, `The date of the event is required`).exists(),
        check(`time`, `The time of the event is required`).exists(),
    ],
    async (request, response) => {
        try {
            const foundEvent = await Event.findOne({
                _id: ObjectId(request.params.id),
            });
            if (!foundEvent) {
                return response
                    .status(404)
                    .send(
                        `This event does not exist. The ID value given is incorrect: ${request.params.id}.`
                    );
            }
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({ errors: errors.array() });
            }
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
