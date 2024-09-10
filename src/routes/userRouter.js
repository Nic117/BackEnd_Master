import { Router } from 'express';
import { UserController } from '../controller/userController.js';
import { auth, verifyJWT } from '../middleware/auth.js';
import upload from '../middleware/multer.js';
export const router = Router()

router.get('/', UserController.getUsers)

router.get('/premium/:uid', verifyJWT, auth(["usuario", "premium"]), UserController.userPremium)

router.post("/resetPassword", verifyJWT, auth(["usuario", "premium"]), UserController.resetPassword);

router.put("/createnewpassword/:token", verifyJWT, auth(["usuario", "premium"]), UserController.createNewPassword);

router.post("/:uid/documents", verifyJWT, auth(["admin", "usuario", "premium"]), upload.array("file"), UserController.uploadUserDocuments)

router.delete("/", verifyJWT, auth(["admin"]), UserController.deleteUsers);

router.delete("/:uid", verifyJWT, auth(["admin"]), UserController.deleteUser);
