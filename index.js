const express = require("express");
const app = express();
const routes = require("./routes");
const logger = require("morgan");
// logger
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let port = process.env.PORT || 3000;

app.use("/api/v1", routes);
app.listen(port, () => {
  console.log("The server is listening on port ", port);
});
