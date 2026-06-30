from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import db

app = FastAPI(title="Quick To-Do")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(db.router)

COLLECTION = "todos"

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: Optional[bool] = False

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

class TodoOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    completed: bool

@app.on_event("startup")
def startup():
    db.init_db()

@app.get("/health")
def health():
    return {"status": "ok", "db": db.backend_name()}

@app.post("/todos", response_model=TodoOut, status_code=201)
def create_todo(todo: TodoCreate):
    record = db.add_record(COLLECTION, todo.model_dump())
    return record

@app.get("/todos", response_model=List[TodoOut])
def list_todos():
    return db.list_records(COLLECTION)

@app.get("/todos/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: str):
    records = db.list_records(COLLECTION)
    for r in records:
        if str(r.get("id")) == str(todo_id):
            return r
    raise HTTPException(status_code=404, detail="Todo not found")

@app.put("/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: str, todo: TodoUpdate):
    update_data = todo.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    existing = get_todo(todo_id)
    record = db.update_record(str(existing["id"]), {**existing, **update_data})
    if record is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return record

@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: str):
    existing = get_todo(todo_id)
    success = db.delete_record(str(existing["id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return None
