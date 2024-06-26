import { Router } from "express"
import { auth } from "../../validator/auth.js"
import { isSelfOrAdmin } from "../../validator/isSelfOrAdmin.js"
import { isAdmin } from "../../validator/isAdmin.js"
import { createComment, createPost, deletePost, getPostById, getPosts, likePost, updatePost, getUserPosts } from "./post.controller.js"

const router = Router()

router.post("/comment", auth, createComment)
router.post("/", auth, createPost)
router.get("/", auth, getPosts)
router.put("/user", auth, getUserPosts)
router.get("/:id", auth, getPostById)
router.put("/", auth, updatePost)
router.delete("/:id", auth, isSelfOrAdmin, deletePost)
router.put("/like/:id", auth, likePost)


export default router 