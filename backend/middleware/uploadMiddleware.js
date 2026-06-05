const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Store in memory for Cloudinary upload

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp|gif/;
  const allowedDocTypes = /pdf|doc|docx/;
  const allowedVideoTypes = /mp4|mov|avi|webm/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isImage = allowedImageTypes.test(ext);
  const isDoc = allowedDocTypes.test(ext);
  const isVideo = allowedVideoTypes.test(ext);

  if (isImage || isDoc || isVideo) {
    return cb(null, true);
  }
  cb(new Error(`Unsupported file type: .${ext}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});

// Preset field configs
const uploadProfileImage = upload.single('avatar');
const uploadDocuments = upload.array('documents', 5);
const uploadIdProofs = upload.array('idProofs', 3);
const uploadIntroVideo = upload.single('introVideo');
const uploadComplaintAttachments = upload.array('attachments', 3);
const uploadAgencyCaregiverFiles = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'idProofs', maxCount: 3 }
]);

module.exports = {
  upload,
  uploadProfileImage,
  uploadDocuments,
  uploadIdProofs,
  uploadIntroVideo,
  uploadComplaintAttachments,
  uploadAgencyCaregiverFiles,
};
