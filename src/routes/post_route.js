import { Router } from 'express';
import {verifyJWT} from '../middleware/auth_middleware.js'
import { 
    uploadRecipePost,
    getRecipePost,
    likeRecipePost,
    bookmarkRecipePost,
    rateRecipePost,
    removeLikeRecipePost,
    removeBookmarkRecipePost,
    getPersonalRecipePost,
    getPersonalBookmarkedRecipePost,
    getPersonalLikedRecipePost
} from '../controllers/post_controller.js';
import {upload} from '../middleware/multer_middleware.js';

const router = Router();


router.route('/upload-recipe-post').post(
    verifyJWT, 
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1
        },
        {
            name: "vedioFile",
            maxCount: 1
        }
    ]),
    uploadRecipePost
);

router.route('/get-recipe-post').get(verifyJWT, getRecipePost);
router.route('/get-personal-recipe-post').get(verifyJWT, getPersonalRecipePost);
router.route('/get-personal-bookmarked-recipe-post').get(verifyJWT, getPersonalBookmarkedRecipePost);
router.route('/get-personal-liked-recipe-post').get(verifyJWT, getPersonalLikedRecipePost);
router.route('/like-recipe-post').get(verifyJWT, likeRecipePost);
router.route('/remove-like-recipe-post').get(verifyJWT, removeLikeRecipePost);
router.route('/bookmark-recipe-post').get(verifyJWT, bookmarkRecipePost);
router.route('/remove-bookmark-recipe-post').get(verifyJWT, removeBookmarkRecipePost);
router.route('/rate-recipe-post').get(verifyJWT, rateRecipePost);

export default router;