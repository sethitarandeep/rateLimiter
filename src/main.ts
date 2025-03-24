import express from "express";


const app = express();
const port = 1212;

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Rate limiter example");
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
