import multer from "multer";

// Disk storage for temporary files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Memory storage for attachments
const memoryStorage = multer.memoryStorage();

const attachmentValidation = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const limits = {
  fileSize: 20 * 1024 * 1024, // 20 MB
};

const memoryUpload = multer({
  memoryStorage,
  attachmentValidation,
  limits,
});

export { upload, memoryUpload };
