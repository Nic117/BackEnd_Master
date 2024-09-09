import { Router } from 'express';
import { UserController } from '../controller/userController.js';
import { auth, verifyJWT } from '../middleware/auth.js';
import upload from '../middleware/multer.js';

export const router = Router();

const authUserPremium = [verifyJWT, auth(["usuario", "premium"])];
const authAdminUserPremium = [verifyJWT, auth(["admin", "usuario", "premium"])];

router.get('/', UserController.getUsers);
router.get('/premium/:uid', ...authUserPremium, UserController.userPremium);
router.post("/resetPassword", ...authUserPremium, UserController.resetPassword);
router.put("/createnewpassword/:token", ...authUserPremium, UserController.createNewPassword);
router.post("/:uid/documents", ...authAdminUserPremium, upload.array("file"), UserController.uploadUserDocuments);
router.delete("/", authAdminUserPremium, UserController.deleteUsers);