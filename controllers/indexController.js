const prisma = require('../lib/prisma');

const getIndex = async (req,res) => {
    res.render('index');
}

const getDashboard = async (req, res) => {
    const user_id = req.user.id
    const user =  await prisma.user.findUnique({
        where: {
            id: user_id
        }
    })
    const folders = await prisma.folder.findMany({
        where: {
            authorId: user_id
        } 
    }) 
    res.render('dashboard', { user: user, folders: folders})
}

module.exports = {
    getIndex,
    getDashboard
}