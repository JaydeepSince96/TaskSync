// src/routes/todoRoutes.ts
import express from "express";
import todoController from "../controllers/todoController";
import statsRoute from "./statsRoute";

const router = express.Router();

// Todo routes
router.get("/labels", todoController.getLabelOptions);
router.get("/", todoController.getAllTodos);
router.post("/", todoController.createTodo);
router.put("/:id", todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);

// Stats routes
router.use("/stats", statsRoute);


//router.use() is a middleware function that is used to mount a complete router or middleware at a specific path. It's like saying "take all the routes defined in this router and mount them under this path". When you use router.use("/stats", statsRoute), it means:
// All routes defined in statsRoute will be prefixed with "/stats"
// It can handle multiple HTTP methods (GET, POST, PUT, DELETE, etc.)
// It's more flexible as it can handle multiple routes from the same router

export default router;  