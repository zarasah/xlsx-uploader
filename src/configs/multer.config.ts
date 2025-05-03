import { diskStorage } from 'multer';
import { extname } from 'path';
import { HttpException, HttpStatus } from "@nestjs/common";

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(xlsx)$/)) {
      return cb(new HttpException('Only .xlsx files are allowed!', HttpStatus.BAD_REQUEST), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
};
