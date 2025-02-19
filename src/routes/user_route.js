import { Router } from 'express';
import {verifyJWT} from '../middleware/auth_middleware.js'
import { 
    registerUser,
    loginUser,
    logoutUser,
    deleteUser,
    refreshAccessToken,
    changeCurrentPassword,
    forgotPassword,
    getCurrentUser,
    updateProfileDetails,
    checkUsernameAndEmail,
    updateUserAvatar 
} from '../controllers/user_controller.js';
import {upload} from '../middleware/multer_middleware.js';

const router = Router();

router.route('/register').post(
    upload.single("avatar"),
    registerUser
);
router.route('/login').post(loginUser);
router.route('/logout').get(verifyJWT, logoutUser);
router.route('/delete').get(verifyJWT, deleteUser);

router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/forgot-password').post(forgotPassword);

router.route('/').get(verifyJWT, getCurrentUser);
router.route('/check').get(checkUsernameAndEmail);
router.route('/update-profile').patch(verifyJWT, updateProfileDetails);
router.route('/update-avatar').patch(verifyJWT, upload.single("avatar") ,updateUserAvatar);

export default router;