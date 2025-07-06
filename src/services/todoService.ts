// src/services/TodoService.ts
import { ITodo, TodoLabel } from "../models/todo";
import Todo from "../models/todo";

class TodoService {
  // Get all todos
  async getAllTodos(): Promise<ITodo[]> {
    return await Todo.find({}).sort({ dueDate: 1 });
  }

  // Create a new todo
  async createTodo(title: string, label: TodoLabel, dueDate: Date): Promise<ITodo> {
    const todo = new Todo({ title, label, dueDate });
    return await todo.save();
  }

  // Update a todo
  async updateTodo(id: string, completed: boolean, label: TodoLabel, dueDate?: Date): Promise<ITodo | null> {
    const updateData: any = { completed, label };
    if (dueDate) updateData.dueDate = dueDate;
    return await Todo.findByIdAndUpdate(id, updateData, { new: true });
  }

  // Delete a todo
  async deleteTodo(id: string): Promise<void> {
    await Todo.findByIdAndDelete(id);
  }
}

export default new TodoService();