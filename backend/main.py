from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import db

app = FastAPI(title="Quick To-Do")

app.include_router(db.router)

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: Optional[bool] = False

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

class TodoOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool

@app.on_event("startup")
def startup():
    db.init_db()

@app.post("/todos", response_model=TodoOut, status_code=201)
def create_todo(todo: TodoCreate):
    record = db.add_record(title=todo.title, description=todo.description, completed=todo.completed)
    return record

@app.get("/todos", response_model=List[TodoOut])
def list_todos():
    return db.list_records()

@app.get("/todos/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: int):
    records = db.list_records()
    for r in records:
        if r.get("id") == todo_id:
            return r
    raise HTTPException(status_code=404, detail="Todo not found")

@app.put("/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, todo: TodoUpdate):
    update_data = todo.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    record = db.update_record(todo_id, **update_data)
    if record is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return record

@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int):
    success = db.delete_record(todo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return None