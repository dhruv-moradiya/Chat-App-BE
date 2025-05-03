import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadFilesToCloudinary = async (buffers, userName, publicIds = []) => {
  try {
    configureCloudinary();

    const uploadPromises = buffers.map((buffer, index) => {
      const public_id = publicIds[index] || undefined;

      return new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: `chat-app/${userName}`,
            public_id,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(buffer).pipe(upload_stream);
      });
    });

    const responses = await Promise.all(uploadPromises);
    console.log("responses :>> ", responses);

    console.log("Files uploaded successfully to Cloudinary");
    return responses;
  } catch (error) {
    console.error("Error while uploading files to Cloudinary:", error.message);
    throw error;
  }
};

export { uploadFilesToCloudinary };
