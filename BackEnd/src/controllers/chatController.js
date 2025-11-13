export async function getStreamToken(req, res) {
    try {
        // used clerkId for Stream (not mongodb id)
        const token = chatClient.createToken(req.user.clerkId)

        res.status(200).json({
            token,
            userId: req.user.clerkId,
            userName: req.user.name,
            userImage: req.user.image
        })
    } catch (error) {
        console.log("Error in getStreamToken controller:", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}