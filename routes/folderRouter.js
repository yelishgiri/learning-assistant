const folderController = require('../controllers/folderController')
const { Router }= require('express')
const { requireAuth } = require('../middleware/auth');
const folderRouter = Router();

folderRouter.get("/create", requireAuth, folderController.createFolderGet);
folderRouter.post("/create", requireAuth, folderController.createFolderPost);

folderRouter.get("/:id/update", requireAuth, folderController.updateFolderGet);
folderRouter.post("/:id/update", requireAuth, folderController.updateFolderPost);

folderRouter.get("/:id/details", requireAuth, folderController.getFolderDetail);

folderRouter.post("/:id/delete", requireAuth, folderController. deleteFolderPost);

module.exports = folderRouter;
