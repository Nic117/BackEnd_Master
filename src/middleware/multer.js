import multer from "multer";
import path from "path";
import fs from "fs";
import __dirname from "../utils/utils.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user) {
      return cb(new Error("El usuario no está autenticado"), false);
    }

    const basePath = path.join(__dirname, "/public/assets/");
    let uploadPath;

    if (file.fieldname === "file") {
      const subfolder = file.mimetype.startsWith("image") ? "img/profiles" : "documents";
      uploadPath = path.join(basePath, subfolder, req.user._id.toString());
    } else if (file.fieldname === "thumbnails") {
      uploadPath = path.join(basePath, "img/products");
    }

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const docType = req.query.document_type;
    const fileExtension = path.extname(file.originalname);
    
    if (!docType) {
      return cb(new Error("document_type no proporcionado"));
    }

    const fileNameMap = {
      "ID": `Comprobante-Identificacion${fileExtension}`,
      "adress": `Comprobante-Domicilio${fileExtension}`,
      "statement": `Comprobante-Cuenta${fileExtension}`,
      "avatar": "ProfilePic",
    };

    const fileName = fileNameMap[docType] || file.originalname.replace(/\s/g, "");
    cb(null, fileName);
  },
});

const upload = multer({ storage });

export default upload;
