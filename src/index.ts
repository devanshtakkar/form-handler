import { PORT, SMTP_SEND_EMAIL } from "./CONSTANTS";
import { generateTransporter } from "./transporter";
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
  listingUrl: z.string().url("Invalid URL format"),
});

// Type for validated form data
type ValidatedContactForm = z.infer<typeof contactFormSchema>;

// Endpoint to handle form data
app.post("/form", async (req: Request, res: Response) => {
  console.log("Received form data:", req.body);

  try {
    const validatedData = contactFormSchema.parse(req.body);

    // Save validated data to Firestore
    await db.collection("ron_forms").add(validatedData);

    // Send email notification
    const htmlContent = `
      <h2>New Property Inquiry Received</h2>
      <p>A new inquiry has been submitted for the following property:</p>
      <p><a href="${validatedData.listingUrl}">View Property Listing</a></p>
      
      <h3>Inquiry Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${validatedData.name}</li>
        <li><strong>Email:</strong> ${validatedData.email}</li>
        <li><strong>Phone:</strong> ${validatedData.phone}</li>
        <li><strong>Message:</strong> ${validatedData.message}</li>
        <li><strong>Submission Date:</strong> ${validatedData.submissionDate.toLocaleString()}</li>
      </ul>
      
      <p>Please respond to this inquiry as soon as possible.</p>
      <hr>
      <p><small>This email was automatically generated from your real estate website's contact form.</small></p>
    `;

    let transporter = generateTransporter();
    await transporter.sendMail({
      from: SMTP_SEND_EMAIL,
      to: "devanshtakkar@gmail.com", // Send to the real estate agent
      replyTo: validatedData.email, // Set reply-to as the inquirer's email
      subject: `New Property Inquiry from ${validatedData.name}`,
      html: htmlContent,
      text: `New Property Inquiry\n\nName: ${validatedData.name}\nEmail: ${validatedData.email}\nPhone: ${validatedData.phone}\nMessage: ${validatedData.message}\nProperty: ${validatedData.listingUrl}\nSubmission Date: ${validatedData.submissionDate.toLocaleString()}`
    });

    // If all operations succeed, proceed with the response
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
      console.error(error);
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
