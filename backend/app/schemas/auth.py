from pydantic import BaseModel

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str 

class LoginRequest(BaseModel):
    email:str
    password:str

class User(BaseModel):
    id: int
    name: str
    email: str
    
class GoogleSignInRequest(BaseModel):
    id_token: str