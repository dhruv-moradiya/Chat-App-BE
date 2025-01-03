// import express from "express";
// import dotenv from "dotenv";
// import { connectDB } from "./db/index.js";
// import { app } from "./app.js";

// dotenv.config({
//   path: ".env",
// });

// connectDB()
//   .then(() => {
//     app.listen(process.env.PORT, () => {
//       console.log(`🦻 Server started on port ${process.env.PORT}`);
//     });
//   })
//   .catch(() => {
//     console.log("❌ Database connection failed");
//   });

import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app, httpServer } from "./app.js";

dotenv.config();

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`🦻 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    console.error("❌ Database connection failed");
  });
