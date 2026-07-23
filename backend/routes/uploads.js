const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
            'video/mp4', 'video/webm', 'video/quicktime',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
        ];
        cb(null, allowed.includes(file.mimetype));
    },
});

const isCloudinaryConfigured = () => Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
);

const normalizeFolder = (folder = 'skillsphere/uploads') => {
    const trimmed = String(folder || 'skillsphere/uploads').trim().replace(/^\/+|\/+$/g, '');
    return trimmed || 'skillsphere/uploads';
};

const inferResourceType = (file) => {
    if (!file?.mimetype) return 'image';
    if (file.mimetype.startsWith('video/')) return 'video';
    if (file.mimetype.startsWith('image/')) return 'image';
    return 'raw';
};

const uploadToCloudinary = (file, folder, resourceType) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        {
            resource_type: resourceType,
            folder: normalizeFolder(folder),
            access_mode: 'public',
        },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
    );
    stream.end(file.buffer);
});

router.post('/media', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file selected.' });
        }

        if (!isCloudinaryConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloudinary is not configured. Please configure your Cloudinary credentials before uploading files.',
            });
        }

        const resourceType = inferResourceType(req.file);
        const folder = req.body?.folder || 'skillsphere/uploads';
        const result = await uploadToCloudinary(req.file, folder, resourceType);

        return res.status(200).json({
            success: true,
            url: result.secure_url,
            type: resourceType,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/files', upload.array('files', 10), async (req, res, next) => {
    try {
        if (!req.files?.length) {
            return res.status(400).json({ success: false, message: 'No files selected.' });
        }

        if (!isCloudinaryConfigured()) {
            return res.status(500).json({
                success: false,
                message: 'Cloudinary is not configured. Please configure your Cloudinary credentials before uploading files.',
            });
        }

        const folder = req.body?.folder || 'skillsphere/uploads';
        const uploadedFiles = await Promise.all(req.files.map(async (file) => {
            const resourceType = inferResourceType(file);
            const result = await uploadToCloudinary(file, folder, resourceType);
            return {
                success: true,
                url: result.secure_url,
                type: resourceType,
                publicId: result.public_id,
                format: result.format,
                bytes: result.bytes,
            };
        }));

        return res.status(200).json({ success: true, files: uploadedFiles });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
