const prisma = require("../lib/prisma");

const createFolderGet = async (req, res) => {
  const user_id = req.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: user_id,
    },
  });
  res.render("folder/create", { user: user });
};

const createFolderPost = async (req, res) => {
  const user_id = req.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: user_id,
    },
  });
  const { user_folder_name } = req.body;
  await prisma.folder.create({
    data: {
      name: user_folder_name,
      authorId: user_id,
    },
  });
  res.redirect("/dashboard");
};

const updateFolderGet = async (req, res) => {
  const user_id = req.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: user_id,
    },
  });
  const folder_id = Number(req.params.id);
  const folder = await prisma.folder.findUnique({
    where: {
      id: folder_id,
    },
  });
  res.render("folder/update", { user: user, folder: folder });
};

const updateFolderPost = async (req, res) => {
  const user_id = req.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: user_id,
    },
  });
  const folder_id = Number(req.params.id);
  const { user_folder_name } = req.body;
  await prisma.folder.update({
    where: {
      id: folder_id,
    },
    data: {
      name: user_folder_name,
    },
  });
  res.redirect("/dashboard");
};

const deleteFolderPost = async (req, res) => {
  const folder_id = Number(req.params.id);
  await prisma.folder.delete({
    where: {
      id: folder_id,
    },
  });
  res.redirect("/dashboard");
};

const getFolderDetail = async (req, res) => {
  const user_id = req.user.id;
  const user = await prisma.user.findUnique({
    where: { id: user_id },
  });
  const folder_id = Number(req.params.id);
  const folder = await prisma.folder.findUnique({
    where: { id: folder_id },
    include: {
      author: true,
      files: {
        include: {
          author: true,
        },
      },
    },
  });
  res.render("folder/details", { user: user, folder: folder });
};

module.exports = {
  createFolderGet,
  createFolderPost,
  updateFolderGet,
  updateFolderPost,
  deleteFolderPost,
  getFolderDetail,
};
