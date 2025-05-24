import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const folderPath = path.join(__dirname, "logs");
console.log("folderPath :>> ", folderPath);

fs.mkdir(folderPath, { recursive: true }, (err) => {
  if (err) {
    console.error("Error creating directory:", err);
  } else {
    console.log("Directory created successfully:", folderPath);
  }
});

const filePath = path.join(folderPath, "log.txt");

console.log("filePath :>> ", filePath);

fs.writeFile(filePath, "Hello World!", (err) => {
  if (err) {
    console.error("Error writing to file:", err);
  } else {
    console.log("File written successfully:", filePath);
  }
});
