import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadFilesToCloudinary = async (filePaths, userName, publicIds = []) => {
  try {
    configureCloudinary();

    const uploadPromises = filePaths.map((localPath, index) => {
      const public_id = publicIds[index] || undefined;
      return cloudinary.uploader.upload(localPath, {
        resource_type: "auto",
        folder: `chat-app/${userName}`,
        public_id,
      });
    });

    const responses = await Promise.all(uploadPromises);
    filePaths.forEach((localPath) => {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error(`Failed to delete local file: ${localPath}`, err.message);
      }
    });

    console.log("Files uploaded successfully to Cloudinary");
    console.log("responses :>> ", responses);
    return responses;
  } catch (error) {
    console.error("Error while uploading files to Cloudinary:", error.message);
    filePaths.forEach((localPath) => {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error(`Failed to delete local file: ${localPath}`, err.message);
        throw err;
      }
    });

    throw error;
  }
};

export { uploadFilesToCloudinary };
