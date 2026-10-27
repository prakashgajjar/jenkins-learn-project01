import { Router } from "express";
import mongoose from "mongoose";
import Todo from "../models/Todo.js";

const router = Router();

function isValidTitle(title) {
  return typeof title === "string" && title.trim().length > 0 && title.trim().length <= 200;
}

router.get("/", async (_req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

router.post("/", async (req, res) => {
  const { title } = req.body;

  if (!isValidTitle(title)) {
    return res.status(400).json({ error: "Title must be between 1 and 200 characters." });
  }

  const todo = await Todo.create({ title: title.trim() });
  res.status(201).json(todo);
});

router.patch("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid todo id." });
  }

  const updates = {};
  const { title, completed } = req.body;

  if (title !== undefined) {
    if (!isValidTitle(title)) {
      return res.status(400).json({ error: "Title must be between 1 and 200 characters." });
    }
    updates.title = title.trim();
  }

  if (completed !== undefined) {
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "Completed must be a boolean." });
    }
    updates.completed = completed;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Provide a title or completed value to update." });
  }

  const todo = await Todo.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!todo) {
    return res.status(404).json({ error: "Todo not found." });
  }

  res.json(todo);
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid todo id." });
  }

  const todo = await Todo.findByIdAndDelete(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: "Todo not found." });
  }

  res.status(204).end();
});

export default router;

