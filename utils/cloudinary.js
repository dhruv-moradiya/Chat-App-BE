import cloudinary from "cloudinary";
import fs from "fs";

const cloudinaryService = cloudinary.v2;

console.log(
  "process.env.CLOUDINARY_CLOUD_NAME :>> ",
  process.env.CLOUDINARY_CLOUD_NAME
);

cloudinaryService.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFilesToCloudinary = async (filePaths, userName, publicIds = []) => {
  try {
    const uploadPromises = filePaths.map((localPath, index) => {
      const public_id = publicIds[index] || undefined; // Use provided public_id or default to undefined
      return cloudinaryService.uploader.upload(localPath, {
        resource_type: "auto",
        folder: `chat-app/${userName}`,
        public_id,
      });
    });

    const responses = await Promise.all(uploadPromises);

    // Clean up local files
    filePaths.forEach((localPath) => {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error(`Failed to delete local file: ${localPath}`, err.message);
      }
    });

    console.log("Files uploaded successfully to Cloudinary");
    return responses; // Return an array of responses
  } catch (error) {
    console.error("Error while uploading files to Cloudinary:", error.message);

    // Attempt to clean up local files even in case of an error
    filePaths.forEach((localPath) => {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error(`Failed to delete local file: ${localPath}`, err.message);
      }
    });

    return null;
  }
};

export { uploadFilesToCloudinary };
