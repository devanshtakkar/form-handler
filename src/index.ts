import { PORT } from "./CONSTANTS";
import express, { Request, Response } from "express";
require("dotenv").config();
const app = express();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Endpoint to handle form data
app.post("/form", (req: Request, res: Response) => {
  console.log("Received form data:");
  console.log(req.body);
  
  res.status(200).json({
    message: "Form data received successfully",
    data: req.body
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${process.env.FORM_PORT}`);
});
