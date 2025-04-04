import express, { Express, Request, Response } from "express";
import cors from "cors";
import { testDbConnection } from "./config/db";
import "./config/dotenv";
import mainRouter from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import multer from "multer";

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

testDbConnection();

app.use("/api/v1", mainRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Roboflow Clone API!");
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Resource not found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/v1`);
});
