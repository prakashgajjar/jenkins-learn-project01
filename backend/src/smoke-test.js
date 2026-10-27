const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:5000";
let createdTodoId;

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

try {
  const { response: invalidResponse } = await request("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title: "   " }),
  });
  if (invalidResponse.status !== 400) {
    throw new Error(`Expected empty title to return 400, received ${invalidResponse.status}.`);
  }

  const { response: createResponse, body: createdTodo } = await request("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title: "Docker Compose smoke test" }),
  });
  if (createResponse.status !== 201 || !createdTodo?._id) {
    throw new Error(`Todo creation failed with status ${createResponse.status}.`);
  }
  createdTodoId = createdTodo._id;

  const { response: listResponse, body: todos } = await request("/api/todos");
  if (!listResponse.ok || !todos.some((todo) => todo._id === createdTodoId)) {
    throw new Error("The new todo was not returned by the list endpoint.");
  }

  const { response: updateResponse, body: updatedTodo } = await request(`/api/todos/${createdTodoId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed: true }),
  });
  if (!updateResponse.ok || updatedTodo.completed !== true) {
    throw new Error("Todo completion update failed.");
  }

  const { response: deleteResponse } = await request(`/api/todos/${createdTodoId}`, {
    method: "DELETE",
  });
  if (deleteResponse.status !== 204) {
    throw new Error(`Todo deletion failed with status ${deleteResponse.status}.`);
  }
  createdTodoId = undefined;

  console.log("API smoke test passed (validation and todo CRUD).");
} finally {
  if (createdTodoId) {
    await request(`/api/todos/${createdTodoId}`, { method: "DELETE" });
  }
}
