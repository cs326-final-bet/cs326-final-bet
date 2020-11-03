import express from 'express';

const app = express();
const port = process.env.PORT || 8000;

app.use(express.static('dist'));

app.get('/', (req, res) => {
    res.redirect('/area.html');
});

app.listen(port, () => {
    console.log(`Server listening on :${port}`);
    console.log(`You should be able to view the server in your web browser at http://127.0.0.1:${port} or http://localhost:${port}`);
});
