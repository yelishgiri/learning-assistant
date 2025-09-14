const prisma = require('../lib/prisma');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer disk storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadPath = path.join(__dirname, '../uploads');
		if (!fs.existsSync(uploadPath)) {
			fs.mkdirSync(uploadPath, { recursive: true });
		}
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		// Use timestamp + original name for uniqueness
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, uniqueSuffix + '-' + file.originalname);
	}
});

const upload = multer({ storage });

// Middleware for file upload (for router)
const uploadMiddleware = upload.array('file', 10); // up to 10 files

// POST /file/upload
const uploadFile = async (req, res) => {
	uploadMiddleware(req, res, async function (err) {
		if (err) {
			return res.status(400).send('File upload error: ' + err.message);
		}
		const user_id = req.user.id;
		const folderId = Number(req.body.folder);
		if (!req.files || req.files.length === 0) {
			return res.status(400).send('No files uploaded.');
		}
		try {
			for (const file of req.files) {
				await prisma.file.create({
					data: {
						name: file.originalname,
						path: file.filename,
						size: file.size,
						folderId: folderId,
						authorId: user_id
					}
				});
			}
			// Redirect to folder details if coming from there
			if (req.body.folder) {
				res.redirect(`/folder/${folderId}/details`);
			} else {
				res.redirect('/dashboard');
			}
		} catch (e) {
			res.status(500).send('Error saving file metadata.');
		}
	});
};
// POST /file/:id/share (stub)
const shareFile = async (req, res) => {
	// Implement actual sharing logic as needed
	res.send('Share feature coming soon!');
};

// GET /file/:id/download
const downloadFile = async (req, res) => {
	const fileId = Number(req.params.id);
	const file = await prisma.file.findUnique({ where: { id: fileId } });
	if (!file) return res.status(404).send('File not found');
	const filePath = path.join(__dirname, '../uploads', file.path);
	if (!fs.existsSync(filePath)) return res.status(404).send('File missing on server');
	res.download(filePath, file.name);
};

// POST /file/:id/delete
const deleteFile = async (req, res) => {
	const fileId = Number(req.params.id);
	const file = await prisma.file.findUnique({ where: { id: fileId } });
	if (!file) return res.status(404).send('File not found');
	const filePath = path.join(__dirname, '../uploads', file.path);
	try {
		await prisma.file.delete({ where: { id: fileId } });
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
		res.redirect('/dashboard');
	} catch (e) {
		res.status(500).send('Error deleting file.');
	}
};

module.exports = {
	uploadFile,
	downloadFile,
	deleteFile,
	shareFile
};