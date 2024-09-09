import multer from "multer";
import path from "path";
import fs from "fs";
import __dirname from "../utils/utils.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.user) {
      return cb(new Error("El usuario no está autenticado"), false);
    }

    let uploadPath = path.join(__dirname, "/public/assets/");
    const userId = req.user._id.toString();

    if (file.fieldname === "file") {
      if (file.mimetype.startsWith("image")) {
        uploadPath = path.join(uploadPath, "img/profiles", userId);
      } else {
        uploadPath = path.join(uploadPath, "documents", userId);
      }
    }

    if (file.fieldname === "thumbnails") {
      uploadPath = path.join(uploadPath, "img/products");
    }

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const docType = req.query.document_type;
    const fileExtension = path.extname(file.originalname);
    let fileName = file.originalname.replace(/\s/g, "");

    if (!docType) {
      return cb(new Error("document_type no proporcionado"));
    }

  
    const fileNameMap = {
      ID: `Comprobante-Identificacion${fileExtension}`,
      adress: `Comprobante-Domicilio${fileExtension}`,
      statement: `Comprobante-Cuenta${fileExtension}`,
      avatar: "ProfilePic",
    };

  
    fileName = fileNameMap[docType] || fileName;

    cb(null, fileName);
  },
});

const upload = multer({ storage });

export default upload;

