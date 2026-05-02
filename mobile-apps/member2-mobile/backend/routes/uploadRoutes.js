const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// POST /api/upload
// Accepts a single image file attached to the form field 'image'
router.post('/', (req, res) => {
    // Handle the upload using our multer middleware
    upload.single('image')(req, res, function (err) {
        if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        // Return the path so the frontend App can save it to the DB (e.g., nvqCertificateUrl)
        // Serve this statically via /uploads/filename.ext
        const fileUrl = `/uploads/${req.file.filename}`;

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            url: fileUrl
        });
    });
});

module.exports = router;
