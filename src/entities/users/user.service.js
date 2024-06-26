import { createLogger } from "vite"
import Post from "../posts/Post.model.js"
import User from "./User.model.js"
import { checkUserIsActive, deleteProfileRepository, getProfileAsUser, getProfileRepository, getUsersAsAdmin, getUsersAsUser, updateProfileRepository } from "./user.repository.js"


export const getUsersService = async (req) => {
    const page = parseInt(req.body.page - 1)
    const pageSize = parseInt(req.body.pageSize) || 1000
    const skip = page * pageSize || 0
    const limit = pageSize
    const roleName = req.tokenData.roleName

    if (roleName == "superadmin" || roleName == "admin") {
        const users = await getUsersAsAdmin(req, skip, limit)
        return users
    }

    if (roleName == "user") {
        const users = await getUsersAsUser(req, skip, limit)
        return users
    }
}

export const getProfileService = async (req, res) => {

    const userName = req.params.userName
    const roleName = req.tokenData.roleName
    if (roleName == "superadmin" || roleName == "admin") {
        const Profile = await getProfileAsUser(req, userName)

        return Profile
    }
    else {
        const Profile = await getProfileAsUser(req, userName)
        return Profile
    }
}

export const deleteProfileService = async (req, res) => {

    const userName = req.params.userName

    const isActive = await checkUserIsActive(userName)

    if (!isActive) {
        throw new Error("User already deleted")
    }

    const profile = await deleteProfileRepository(userName)

    return profile
}

export const updateProfileService = async (req) => {

    const profile = await updateProfileRepository(req)

    return profile
}

export const followProfileService = async (req) => {

    const userToFollowName = req.params.userName
    const userName = req.tokenData.userName

    const isActive = await checkUserIsActive(userToFollowName)

    if (!isActive) {
        throw new Error("User not found")
    }
    if (userToFollowName == userName) {
        throw new Error("You cant follow yourself")
    }

    const userToFollow = await getProfileRepository(userToFollowName)
    const userFollowing = await getProfileRepository(userName)

    if (userToFollow[0].followers.includes(userName)) {

        userToFollow[0].followers.pull(userName)
        userFollowing[0].following.pull(userToFollowName)

    } else {

        if (userToFollow[0].visibility !== "public") {
            userToFollow[0].followRequests.push(userName)
        }
        else {
            userToFollow[0].followers.push(userName)
            userFollowing[0].following.push(userToFollowName)
        }

    }

    await userFollowing[0].save()
    await userToFollow[0].save()

    return { userToFollow, userFollowing }
}

export const getProfilePostsService = async (req, res) => {

    const userName = req.params.userName
    const user = await User.find({ userName: userName })
    let posts

    if (user[0].visibility == "public"
        || user[0].followers.includes(req.tokenData.userName)
        || userName == req.tokenData.userName) {

        posts = await Post.find({
            $and: [
                { authorId: user[0]._id },
                { is_active: true }
            ]
        })
    }
    else {
        throw new Error("No permision to see this posts")
    }

    return posts
}

export const acceptFollowService = async (req, res) => {

    const userToAcceptName = req.params.userName
    const userName = req.tokenData.userName

    const userToAccept = await getProfileRepository(userToAcceptName)
    const user = await getProfileRepository(userName)

    user[0].followRequests.pull(userToAcceptName)
    user[0].followers.push(userToAcceptName)
    userToAccept[0].following.push(userName)

    await userToAccept[0].save()
    await user[0].save()

    return { userToFollow, userFollowing }
}

export const declineFollowService = async (req, res) => {
    const userToAcceptName = req.params.userName
    const userName = req.tokenData.userName

    const user = await getProfileRepository(userName)

    if (!user[0].followRequests.includes(userToAcceptName)) {
        throw new Error("Request not found")
    }

    user[0].followRequests.pull(userToAcceptName)

    await user[0].save()

    return user
}

export const getFollowRequestsService = async (req, res) => {

    const userName = req.tokenData.userName
    const user = await User.find({ userName: userName }, "followRequests")

    return user[0].followRequests
}