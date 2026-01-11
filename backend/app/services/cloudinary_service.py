import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from dataclasses import dataclass
from cloudinary.exceptions import Error as CloudinaryError
from fastapi import File, UploadFile

from app.core.conf import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
import asyncio

@dataclass
class CloudinaryService:
    cloud_name: str = CLOUDINARY_CLOUD_NAME
    api_key: str = CLOUDINARY_API_KEY
    api_secret: str = CLOUDINARY_API_SECRET
    secure: bool = True

    def __post_init__(self) -> None:
        cloudinary.config( 
            cloud_name = self.cloud_name, 
            api_key = self.api_key, 
            api_secret = self.api_secret, 
            secure=self.secure
        )
    
    async def upload_from_file_obj(self,file_obj:str,public_id:str)->str:
        try:
            return await asyncio.to_thread(
                cloudinary.uploader.upload,
                file_obj,
                public_id=public_id
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error uploading file from file object: {e}")
    
    async def upload_from_path(self,file_path:str,public_id:str) -> str:
        try:
            return await asyncio.to_thread(
                cloudinary.uploader.upload,
                file_path,
                public_id=public_id
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error uploading image from file: {e}")
            

    async def upload_from_bytes(self,file_bytes:bytes,public_id:str) -> str:
        try:
            return await asyncio.to_thread(
                cloudinary.uploader.upload,
                file_bytes,
                public_id=public_id
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error uploading file from bytes: {e}")

    
    async def upload_unsigned(self, file_source, upload_preset: str, folder: str = None):
        """Unsigned upload (frontend → Cloudinary directly)"""
        try:
            return await asyncio.to_thread(
            cloudinary.uploader.unsigned_upload,
            file_source,
            upload_preset=upload_preset,
            folder=folder,
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error uploading unsigned image: {e}")


    async def upload_from_url(self,file_url:str,public_id:str) -> str:
        try:
            return await asyncio.to_thread(
                cloudinary.uploader.upload,
                file_url,
                public_id=public_id
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error uploading file from url: {e}")

    async def optimize_image(self,public_id:str) -> str:
        try:
            return await asyncio.to_thread(
                cloudinary_url,
                public_id,
                fetch_format="auto",
                quality="auto"
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error optimizing image: {e}")

    async def transform_image(self,public_id:str,width:int,height:int,crop:str,gravity:str) -> str:
        try:
            return await asyncio.to_thread(
                cloudinary_url,
                public_id,
                width=width,
                height=height,
                crop=crop,
                gravity=gravity
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error transforming image: {e}")

    async def delete_file(self,public_id:str) -> bool:
        try:
            return await asyncio.to_thread(
                cloudinary.uploader.destroy,
                public_id
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error deleting file: {e}")

    async def get_file_url(self,public_id:str) -> str:
        try:
            return await asyncio.to_thread(
                cloudinary_url,
                public_id
            )
        except CloudinaryError as e:
            raise CloudinaryError(f"Error getting file url: {e}")
