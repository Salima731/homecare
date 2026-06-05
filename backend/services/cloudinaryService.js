const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload a buffer to Cloudinary via stream
 * @param {Buffer} fileBuffer
 * @param {Object} options - { folder, resource_type, transformation }
 * @returns { url, publicId }
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'careconnect/general',
      resource_type: options.resource_type || 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete a resource from Cloudinary by publicId
 */
const deleteFromCloudinary = async (publicId, resource_type = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Upload profile avatar
 */
const uploadAvatar = (buffer) =>
  uploadToCloudinary(buffer, {
    folder: 'careconnect/avatars',
    resource_type: 'image',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });

/**
 * Upload agency document / ID proof
 */
const uploadDocument = (buffer, subfolder = 'documents') =>
  uploadToCloudinary(buffer, {
    folder: `careconnect/${subfolder}`,
    resource_type: 'auto',
  });

/**
 * Upload intro video
 */
const uploadVideo = (buffer) =>
  uploadToCloudinary(buffer, {
    folder: 'careconnect/videos',
    resource_type: 'video',
  });

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadAvatar,
  uploadDocument,
  uploadVideo,
};
