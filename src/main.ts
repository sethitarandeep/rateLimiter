import express from "express";
import Routes from "./routes/Route";
import { connectRedis, disconnectRedis } from "./utils/Redis";

const app = express();
const port = process.env.PORT || 3000;

app.use("/", new Routes().routes);
connectRedis();
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


//Graceful shutdown, can handle uncaught exceptions and unhandled rejections as well
process.on('SIGTERM', async () => {
    await disconnectRedis()
    server.close(() => {
        console.log('Process terminated')
    })
})
