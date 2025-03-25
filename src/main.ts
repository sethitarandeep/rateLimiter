import express from "express";
import Routes from "./routes/Route";
import { connect } from "./utils/Redis";

const app = express();
const port = process.env.PORT || 3000;

app.use("/", new Routes().routes);
connect();  
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
