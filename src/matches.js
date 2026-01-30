import express from 'express';
import { matchRouter } from './routes/matches';

const app = express();
const PORT = 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
    res.json({ message: "Hello! Welcome to the Sportbuzz server." });
});

app.get('/matches', (matchRouter))

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
