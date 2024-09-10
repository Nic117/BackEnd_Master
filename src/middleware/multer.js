import multer from "multer";
import path from "path";
import fs from "fs";
import __dirname from "../utils/utils.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user) {
      return cb(new Error("El usuario no está autenticado"), false);
    }

    let uploadPath = path.join(__dirname, "/public/assets/");

    if ((file.fieldname === "file") & !file.mimetype.startsWith("image")) {
      uploadPath = path.join(uploadPath, "documents", req.user._id.toString());
    }
    if ((file.fieldname === "file") & file.mimetype.startsWith("image")) {
      uploadPath = path.join(uploadPath, "img/profiles", req.user._id.toString());
    }
    if (file.fieldname === "thumbnails") {
      uploadPath = path.join(uploadPath, "img/products");
    }

    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const docType = req.query.document_type;
    let fileName = file.originalname.replace(/\s/g, "");
    const fileExtension = path.extname(file.originalname);

    if (!docType) {
        return cb(new Error("document_type no proporcionado"));
    }

    switch (docType) {
        case "ID":
            fileName = `Comprobante-Identificacion${fileExtension}`;
            break;
        case "adress":
            fileName = `Comprobante-Domicilio${fileExtension}`;
            break;
        case "statement":
            fileName = `Comprobante-Cuenta${fileExtension}`;
            break;
        case "avatar":
            fileName = `ProfilePic${fileExtension}`;
            break;
        default:
            fileName = `${fileName}`;
    }

    cb(null, fileName);
},
});

const upload = multer({ storage });

export default upload;