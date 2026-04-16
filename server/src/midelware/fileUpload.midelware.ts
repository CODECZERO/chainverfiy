import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Use os.tmpdir() for serverless environments (Vercel) where project dirs are read-only.
const UPLOAD_ROOT = os.tmpdir();

// A function to ensure that the folder exists (Synchronous for Multer stability)
const ensureFolderSync = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      return true;
    }
    fs.mkdirSync(filePath, { recursive: true });
    return true;
  } catch (error: any) {
    console.error(`❌ Error creating directory ${filePath}:`, error.message);
    return false;
  }
};

// Multer function to store file in local server
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use os.tmpdir() directly for cross-platform and serverless stability
    const folderExistPath = UPLOAD_ROOT;
    const exists = ensureFolderSync(folderExistPath);
    
    if (exists) {
      cb(null, folderExistPath);
    } else {
      cb(new Error(`Failed to initialize upload directory: ${folderExistPath}`), '');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFormats = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp', 
    'image/bmp',
    'image/tiff',
    'application/pdf'
  ];
  
  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Note: Multer does not provide a default error if fileFilter returns false.
    // It simply leaves req.file as undefined.
    cb(null, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB of image size
});
