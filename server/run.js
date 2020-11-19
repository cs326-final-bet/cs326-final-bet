import { app } from "./index.js";

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`\
Server listening on port ${port}. View in your web browser:

    http://127.0.0.1:${port} or http://localhost:${port}`);
});
