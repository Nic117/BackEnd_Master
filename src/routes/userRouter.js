import { Router } from 'express';
import { UserController } from '../controller/userController.js';
export const router = Router()

router.get('/', UserController.getUsers)

router.get('/premium/:uid', UserController.userPremium)

router.post("/resetPassword", UserController.resetPassword);

router.put("/createnewpassword/:token", UserController.createNewPassword);

