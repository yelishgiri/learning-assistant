const folderController = require('../controllers/folderController')
const { Router }= require('express')
const folderRouter = Router();

folderRouter.get("/create", folderController.createFolderGet);
folderRouter.post("/create", folderController.createFolderPost);

folderRouter.get("/:id/update", folderController.updateFolderGet);
folderRouter.post("/:id/update", folderController.updateFolderPost);

folderRouter.get("/:id/details", folderController.getFolderDetail);

folderRouter.post("/:id/delete", folderController. deleteFolderPost);

module.exports = folderRouter;
