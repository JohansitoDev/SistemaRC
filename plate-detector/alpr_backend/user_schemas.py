from pydantic import BaseModel, EmailStr, Field, model_validator


class RegisterPayload(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    password_confirmation: str = Field(min_length=8, max_length=72)

    @model_validator(mode='after')
    def passwords_match(self):
        if self.password != self.password_confirmation:
            raise ValueError('Las contraseñas no coinciden.')
        return self


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)
