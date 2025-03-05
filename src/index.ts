import { PORT } from "./CONSTANTS";
import express, { Request, Response } from "express";
require("dotenv").config();
import { Firestore } from "@google-cloud/firestore";
import { z } from "zod";

const app = express();

// Firestore setup
const db = new Firestore({
  projectId: "ron-basra"
});

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Zod schema for form validation
const contactFormSchema = z.object({
  formId: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.number({
    invalid_type_error: "Phone must be a number",
  }),
  message: z.string().min(1, "Message is required"),
  submissionDate: z.string().transform((str) => new Date(str)),
  lisitngUrl: z.string().url("Invalid URL format"),
});

// Type for validated form data
type ValidatedContactForm = z.infer<typeof contactFormSchema>;

// Endpoint to handle form data
app.post("/form",async  (req: Request, res: Response) => {
  console.log("Received form data:", req.body);

  try {
    const validatedData = contactFormSchema.parse(req.body);

    // Save validated data to Firestore
    await db.collection("ron_forms").add(validatedData);
    
    // If validation succeeds, proceed with the validated data
    res.status(200).json({
      message: "Form data validated and received successfully",
      data: validatedData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Send validation errors back to client
      res.status(400).json({
        message: "Form validation failed",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
      // Handle unexpected errors
      res.status(500).json({
        message: "An unexpected error occurred",
        error: "Internal server error"
      });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${process.env.FORM_PORT}`);
});
